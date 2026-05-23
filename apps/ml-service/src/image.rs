use crate::error::ServiceError;
use image::ImageReader;
use ndarray::Array4;
use std::io::Cursor;

/// Preprocesses an image from bytes into an NHWC f32 array.
///
/// # Arguments
/// * `bytes` - Raw image bytes (PNG, JPEG, etc.)
/// * `input_size` - Target size for both width and height
///
/// # Returns
/// * `Result<Array4<f32>, ServiceError>` - Array with shape (1, input_size, input_size, 3) in NHWC format
///   or BadRequest error if the image is invalid
pub fn preprocess_image(bytes: &[u8], input_size: u32) -> Result<Array4<f32>, ServiceError> {
    // Decode image from bytes
    let cursor = Cursor::new(bytes);
    let reader = ImageReader::new(cursor)
        .map_err(|_| ServiceError::BadRequest("Uploaded file is not a valid image".to_string()))?;

    let image = reader
        .decode()
        .map_err(|_| ServiceError::BadRequest("Uploaded file is not a valid image".to_string()))?;

    // Convert to RGB
    let rgb_image = image.to_rgb8();

    // Resize to input_size x input_size using Triangle filter
    let resized = image::imageops::resize(
        &rgb_image,
        input_size,
        input_size,
        image::imageops::FilterType::Triangle,
    );

    // Create Array4<f32> with shape (1, input_size, input_size, 3) in NHWC format
    let (width, height) = resized.dimensions();
    let pixels = resized.into_raw();

    // pixels is a flat Vec<u8> in RGB order (R, G, B, R, G, B, ...)
    // Convert to f32 and reshape to (1, height, width, 3)
    let float_pixels: Vec<f32> = pixels.iter().map(|&p| p as f32).collect();

    let array = Array4::from_shape_vec(
        (1, height as usize, width as usize, 3),
        float_pixels,
    )
    .map_err(|_| {
        ServiceError::BadRequest("Failed to reshape image data".to_string())
    })?;

    Ok(array)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper to create a simple 2x1 RGB PNG with specific pixel values
    fn create_test_png() -> Vec<u8> {
        use image::RgbImage;

        // Create a 2x1 image
        let mut img = RgbImage::new(2, 1);

        // Set first pixel to [10, 20, 30]
        img.put_pixel(0, 0, image::Rgb([10, 20, 30]));

        // Set second pixel to [40, 50, 60]
        img.put_pixel(1, 0, image::Rgb([40, 50, 60]));

        // Encode to PNG bytes
        let mut png_bytes = Vec::new();
        img.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)
            .expect("failed to encode PNG");

        png_bytes
    }

    #[test]
    fn preprocess_image_correct_shape_and_values() {
        let png_bytes = create_test_png();
        let result = preprocess_image(&png_bytes, 2);

        assert!(result.is_ok(), "preprocessing should succeed");
        let array = result.unwrap();

        // Check shape is (1, 2, 2, 3)
        assert_eq!(array.shape(), &[1, 2, 2, 3]);

        // After resizing 2x1 to 2x2, we expect interpolation
        // Check that first pixel channel values are present (at least the first row)
        // The exact values depend on interpolation, but we can verify the structure
        let first_batch = &array.slice(ndarray::s![0, .., .., ..]);
        assert_eq!(first_batch.shape(), &[2, 2, 3]);

        // Verify first pixel (0, 0) has 3 channels
        let pixel_0_0 = &first_batch.slice(ndarray::s![0, 0, ..]);
        assert_eq!(pixel_0_0.len(), 3);

        // The first pixel should be close to [10, 20, 30] (may be interpolated)
        // We'll just verify it's in a reasonable range
        assert!(pixel_0_0[0] >= 5.0 && pixel_0_0[0] <= 25.0);
        assert!(pixel_0_0[1] >= 15.0 && pixel_0_0[1] <= 35.0);
        assert!(pixel_0_0[2] >= 25.0 && pixel_0_0[2] <= 45.0);
    }

    #[test]
    fn invalid_image_returns_bad_request() {
        let invalid_bytes = b"not a valid image";
        let result = preprocess_image(invalid_bytes, 224);

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::BadRequest(detail) => {
                assert_eq!(detail, "Uploaded file is not a valid image");
            }
            _ => panic!("expected BadRequest error"),
        }
    }
}
