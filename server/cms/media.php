<?php
declare(strict_types=1);
require __DIR__ . "/_bootstrap.php";

/**
 * Media library — image/video files managed from the admin UI.
 *
 *   GET    /cms/media.php              -> { items: [...] }                  (admin)
 *   POST   /cms/media.php              -> multipart "file"; create          (admin)
 *   POST   /cms/media.php  +"name"=F   -> multipart "file"; REPLACE file F in place (admin)
 *   DELETE /cms/media.php?id=N         -> delete DB upload (row + file)      (admin)
 *   DELETE /cms/media.php?name=F       -> delete docroot/upload file F       (admin)
 *
 * Uploads are stored under config "upload_dir" (served from "upload_url").
 * The library also surfaces the static site assets in "assets_dir" so the user
 * can replace/remove the live images (course posters, etc.) right in place.
 */

// No SVG: an SVG can carry inline <script> that runs same-origin when the file
// is opened directly (no CSP on static assets), which would let a stored upload
// steal the admin token. Raster + video only — sanitizing SVG isn't worth it.
const ALLOWED_MIME = [
    "image/jpeg" => "jpg",
    "image/png"  => "png",
    "image/webp" => "webp",
    "image/gif"  => "gif",
];
// Replacing an existing file may also target a video; the name/extension is
// kept as-is, we only swap the bytes. (No SVG here either — same reason.)
const REPLACE_MIME = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/webm", "video/quicktime",
];
// The only extensions the library lists / lets you touch — this is the guard
// that keeps replace+delete away from .php/.html/.svg/config files in the docroot.
const MEDIA_EXT = ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov"];
const MAX_BYTES = 8388608; // 8 MB

$me = require_auth(); // every method here is admin-only

$uploadDir = rtrim((string)($CONFIG["upload_dir"] ?? ""), "/");
$uploadUrl = rtrim((string)($CONFIG["upload_url"] ?? "/uploads"), "/");
// Default to the docroot (serves the SPA + public images at "/"); fall back to
// the cms parent dir if DOCUMENT_ROOT isn't set (cms/ lives under the docroot).
$assetsDir = rtrim((string)($CONFIG["assets_dir"] ?? ($_SERVER["DOCUMENT_ROOT"] ?: dirname(__DIR__))), "/");
$assetsUrl = rtrim((string)($CONFIG["assets_url"] ?? ""), "/");

function media_url(string $url, string $filename): string
{
    return $url . "/" . rawurlencode($filename);
}

/** URL for a file living directly in the assets dir (served at assets_url, "" = docroot "/"). */
function asset_url(string $assetsUrl, string $filename): string
{
    return ($assetsUrl === "" ? "/" : $assetsUrl . "/") . rawurlencode($filename);
}

/**
 * Resolve a client-supplied filename to a real, in-bounds media file.
 * Guards: basename only (no path / traversal), a media extension, and the file
 * must ALREADY exist inside one of $dirs (resolved with realpath to block
 * symlink escapes). Returns ["path","dir"] or null. This is the trust boundary
 * that prevents replacing/deleting arbitrary docroot files.
 */
function safe_media_target(string $name, array $dirs): ?array
{
    if ($name === "" || basename($name) !== $name) return null;
    $ext = strtolower((string)pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, MEDIA_EXT, true)) return null;
    foreach ($dirs as $dir) {
        if ($dir === "" || !is_dir($dir)) continue;
        $path = $dir . "/" . $name;
        if (!is_file($path)) continue;
        $rp = realpath($path);
        $rd = realpath($dir);
        if ($rp !== false && $rd !== false && str_starts_with($rp, $rd . DIRECTORY_SEPARATOR)) {
            return ["path" => $path, "dir" => $dir];
        }
    }
    return null;
}

switch (method()) {

    case "GET": {
        $rows = db()->query("SELECT * FROM media ORDER BY id DESC")->fetchAll();
        foreach ($rows as &$r) { $r["url"] = media_url($uploadUrl, $r["filename"]); }
        unset($r);

        // Also surface the static site assets shipped in the docroot (courses_*.jpg,
        // poster art, svgs, any videos...) so the library shows everything that's
        // actually live, not just admin uploads. ponytail: glob the dir, no manifest.
        if (is_dir($assetsDir)) {
            $have = array_column($rows, "filename", "filename"); // skip names already in DB
            foreach (glob($assetsDir . "/*.{jpg,jpeg,png,webp,gif,mp4,webm,mov,JPG,JPEG,PNG}", GLOB_BRACE) ?: [] as $path) {
                $name = basename($path);
                if (isset($have[$name])) continue;
                $rows[] = [
                    "id" => null, "filename" => $name, "original" => $name,
                    "mime" => mime_content_type($path) ?: null,
                    "size_bytes" => filesize($path) ?: null,
                    "asset" => true, // no DB row, but can be replaced/deleted by name
                    "url" => asset_url($assetsUrl, $name),
                ];
            }
        }
        json_out(["items" => $rows]);
    }

    case "POST": {
        if (empty($_FILES["file"]) || !is_uploaded_file($_FILES["file"]["tmp_name"] ?? "")) {
            json_error("No file uploaded (multipart field 'file')", 422);
        }
        $f = $_FILES["file"];
        if (($f["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            json_error("Upload error", 422);
        }
        if (($f["size"] ?? 0) > MAX_BYTES) {
            json_error("File too large (max 8 MB)", 422);
        }
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime  = (string)$finfo->file($f["tmp_name"]); // trust the sniff, not the client

        // --- Replace mode: swap the bytes of an existing file, keep its name ---
        $replaceName = trim((string)($_POST["name"] ?? ""));
        if ($replaceName !== "") {
            if (!in_array($mime, REPLACE_MIME, true)) {
                json_error("Unsupported file type", 422);
            }
            $target = safe_media_target($replaceName, [$uploadDir, $assetsDir]);
            if (!$target) json_error("Unknown file to replace", 422);
            // Overwriting a live docroot file is admin-tier; uploads dir is open to any editor.
            if ($target["dir"] === $assetsDir && ($me["role"] ?? "") !== "admin") {
                json_error("Forbidden", 403);
            }
            // The new bytes keep the original name+extension, so the served
            // Content-Type stays tied to that extension — require the upload to
            // be the same family (don't drop video bytes into a .jpg, etc.).
            $ext = strtolower((string)pathinfo($replaceName, PATHINFO_EXTENSION));
            $wantImage = in_array($ext, ["jpg", "jpeg", "png", "webp", "gif"], true);
            if ($wantImage !== str_starts_with($mime, "image/")) {
                json_error("Replacement must match the file type (image vs video)", 422);
            }
            if (!@move_uploaded_file($f["tmp_name"], $target["path"])) {
                json_error("Could not write file", 500);
            }
            // ponytail: the new bytes keep the original name+extension. Replace a
            // jpg with a jpg; mismatched formats still render (browsers sniff) but
            // are sloppy — not worth renaming + rewriting every reference here.
            [$w, $h] = @getimagesize($target["path"]) ?: [null, null];
            db()->prepare(
                "UPDATE media SET mime = ?, size_bytes = ?, width = ?, height = ? WHERE filename = ?"
            )->execute([$mime, (int)$f["size"], $w ?: null, $h ?: null, $replaceName]);
            $url = $target["dir"] === $uploadDir
                ? media_url($uploadUrl, $replaceName)
                : asset_url($assetsUrl, $replaceName);
            json_out(["ok" => true, "filename" => $replaceName, "url" => $url]);
        }

        // --- Create mode: store under a new safe filename, record in DB ---
        if (!isset(ALLOWED_MIME[$mime])) {
            json_error("Unsupported file type", 422);
        }
        $ext = ALLOWED_MIME[$mime];
        if ($uploadDir === "" || (!is_dir($uploadDir) && !@mkdir($uploadDir, 0775, true))) {
            json_error("Upload directory not writable", 500);
        }
        $stem = pathinfo((string)($f["name"] ?? "file"), PATHINFO_FILENAME);
        $stem = preg_replace('/[^A-Za-z0-9_-]+/', "-", $stem) ?: "file";
        $stem = trim(substr($stem, 0, 60), "-") ?: "file";
        $filename = $stem . "-" . bin2hex(random_bytes(4)) . "." . $ext;

        $dest = $uploadDir . "/" . $filename;
        if (!@move_uploaded_file($f["tmp_name"], $dest)) {
            json_error("Could not store file", 500);
        }
        [$w, $h] = @getimagesize($dest) ?: [null, null];
        $user = current_user();
        $stmt = db()->prepare(
            "INSERT INTO media (filename, original, mime, size_bytes, width, height, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $filename, (string)($f["name"] ?? ""), $mime, (int)$f["size"],
            $w ?: null, $h ?: null, $user["id"] ?? null,
        ]);
        $id  = (int)db()->lastInsertId();
        $row = db()->prepare("SELECT * FROM media WHERE id = ?");
        $row->execute([$id]);
        $item = $row->fetch();
        $item["url"] = media_url($uploadUrl, $item["filename"]);
        json_out(["item" => $item], 201);
    }

    case "DELETE": {
        // Delete a docroot/upload file by name (covers the read-only site assets)...
        $name = trim((string)(q("name") ?? ""));
        if ($name !== "") {
            $target = safe_media_target($name, [$uploadDir, $assetsDir]);
            if (!$target) json_error("Unknown file", 422);
            if ($target["dir"] === $assetsDir && ($me["role"] ?? "") !== "admin") {
                json_error("Forbidden", 403);
            }
            // Surface a failed unlink (e.g. docroot not writable) instead of
            // falsely reporting success; an already-gone file still counts as ok.
            if (!@unlink($target["path"]) && is_file($target["path"])) {
                json_error("Could not delete file", 500);
            }
            db()->prepare("DELETE FROM media WHERE filename = ?")->execute([$name]);
            json_out(["ok" => true]);
        }
        // ...or a DB upload by id.
        $id = (int)q("id");
        if ($id <= 0) json_error("id or name is required", 422);
        $row = db()->prepare("SELECT filename FROM media WHERE id = ?");
        $row->execute([$id]);
        $m = $row->fetch();
        if ($m) {
            @unlink($uploadDir . "/" . $m["filename"]);
            db()->prepare("DELETE FROM media WHERE id = ?")->execute([$id]);
        }
        json_out(["ok" => true]);
    }

    default:
        json_error("Method not allowed", 405);
}
