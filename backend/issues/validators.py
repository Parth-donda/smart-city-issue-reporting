import os
from PIL import Image
from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov'}

# Magic bytes (file signatures) to prevent disguised files
IMAGE_SIGNATURES = {
    b'\xff\xd8\xff': 'jpeg',
    b'\x89PNG\r\n\x1a\n': 'png',
    b'RIFF': 'webp',
}


def validate_uploaded_image(file):
    """
    Validates file size, extension, binary signature (magic bytes),
    and opens the file with Pillow to verify it is not corrupt.
    """
    if file.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError(f"Image '{file.name}' exceeds the maximum allowed size of 5 MB.")

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(f"Invalid image format '{ext}'. Permitted formats: JPEG, PNG, WebP.")

    # Read the first 16 bytes for magic number verification
    file.seek(0)
    header = file.read(16)
    file.seek(0)

    is_valid_signature = False
    for sig in IMAGE_SIGNATURES:
        if header.startswith(sig) or (sig == b'RIFF' and len(header) >= 12 and header[8:12] == b'WEBP'):
            is_valid_signature = True
            break

    if not is_valid_signature and ext != '.png' and ext != '.webp':
        raise ValidationError(f"File signature mismatch for '{file.name}'. Uploaded file is disguised or corrupted.")

    # Verify image integrity and dimensions using Pillow
    try:
        img = Image.open(file)
        img.verify()
        file.seek(0)

        # Reload for dimension inspection
        img = Image.open(file)
        width, height = img.size
        if width < 150 or height < 150:
            raise ValidationError(f"Image '{file.name}' dimensions ({width}x{height}) are too small. Minimum is 150x150 px.")
        if width > 7000 or height > 7000:
            raise ValidationError(f"Image '{file.name}' dimensions ({width}x{height}) are too large. Maximum is 7000x7000 px.")
        file.seek(0)
    except Exception as e:
        if isinstance(e, ValidationError):
            raise e
        raise ValidationError(f"Uploaded file '{file.name}' is corrupt or not a valid image.")


def validate_uploaded_video(file):
    """
    Validates video file size and extension.
    """
    if file.size > MAX_VIDEO_SIZE_BYTES:
        raise ValidationError(f"Video '{file.name}' exceeds the maximum allowed size of 25 MB.")

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise ValidationError(f"Invalid video format '{ext}'. Permitted formats: MP4, WebM, MOV.")
