// Global variables
let currentImage = null;
let selectedSizes = {};
let batchFiles = [];
let conversionResults = [];

// Check if GIF libraries are loaded
function checkGifLibraries() {
  if (typeof GIF === "undefined" || typeof window.GifuctJS === "undefined") {
    showError("GIF processing libraries not loaded. Please refresh the page.");
    return false;
  }
  return true;
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  // Check if GIF libraries are available
  setTimeout(() => {
    if (!checkGifLibraries()) {
      console.warn(
        "GIF libraries not available. GIF processing will be limited."
      );
    } else {
      console.log("✅ GIF processing libraries loaded successfully");
    }
  }, 12000);
});

// Tab switching
function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Remove active class from all tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected tab content
  document.getElementById(tabName).classList.add("active");

  // Add active class to clicked tab
  event.target.classList.add("active");
}

// Drag and drop handlers
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processImageFile(files[0]);
  }
}

function handleIconDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processIconFile(files[0]);
  }
}

function handleBatchDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");
  const files = Array.from(e.dataTransfer.files);
  processBatchFiles(files);
}

// Image upload handlers
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    processImageFile(file);
  }
}

function handleIconUpload(e) {
  const file = e.target.files[0];
  if (file) {
    processIconFile(file);
  }
}

function handleBatchUpload(e) {
  const files = Array.from(e.target.files);
  processBatchFiles(files);
}

// Process uploaded image
function processImageFile(file) {
  if (!file.type.startsWith("image/")) {
    showError("Please upload a valid image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      currentImage = { file, img, data: e.target.result };
      displayImageInfo();
      showFormatOptions();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Display image information
function displayImageInfo() {
  const info = document.getElementById("imageInfo");
  const details = document.getElementById("imageDetails");
  const preview = document.getElementById("originalPreview");

  details.innerHTML = `
                <div class="info-item">
                    <span>Filename:</span>
                    <span>${currentImage.file.name}</span>
                </div>
                <div class="info-item">
                    <span>Size:</span>
                    <span>${formatFileSize(currentImage.file.size)}</span>
                </div>
                <div class="info-item">
                    <span>Dimensions:</span>
                    <span>${currentImage.img.width} × ${
    currentImage.img.height
  } pixels</span>
                </div>
                <div class="info-item">
                    <span>Type:</span>
                    <span>${currentImage.file.type}</span>
                </div>
                <div class="info-item">
                    <span>Aspect Ratio:</span>
                    <span>${(
                      currentImage.img.width / currentImage.img.height
                    ).toFixed(2)}:1</span>
                </div>
            `;

  preview.src = currentImage.data;
  preview.style.display = "block";
  info.style.display = "block";
}

// Show format conversion options
function showFormatOptions() {
  document.getElementById("formatOptions").style.display = "grid";

  // Reset size selections
  selectedSizes = {
    png: "original",
    jpeg: "original",
    webp: "original",
    gif: "original",
  };

  // Update size option displays
  document.querySelectorAll(".size-option").forEach((option) => {
    option.classList.remove("selected");
    if (option.textContent === "Original") {
      option.classList.add("selected");
    }
  });
}

// Size selection
function selectSize(element, format, size) {
  // Remove selection from siblings
  element.parentNode.querySelectorAll(".size-option").forEach((opt) => {
    opt.classList.remove("selected");
  });

  // Add selection to clicked element
  element.classList.add("selected");
  selectedSizes[format] = size;
}

// Quality display update
function updateQualityDisplay(value) {
  document.getElementById("qualityDisplay").textContent = value + "%";
}

// Convert image to specified format with enhanced GIF support
async function convertImage(format) {
  if (!currentImage) {
    showError("Please upload an image first.");
    return;
  }

  showProgress();

  try {
    // Handle GIF conversion specially
    if (format === "gif" && currentImage.file.type === "image/gif") {
      await convertGifImage(format);
      return;
    }

    // For static images or converting to non-GIF formats
    await convertStaticImage(format);
  } catch (error) {
    hideProgress();
    showError(`Conversion failed: ${error.message}`);
  }
}

// Convert static images or GIF to static formats
async function convertStaticImage(format) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate dimensions
        const targetSize = selectedSizes[format];
        let { width, height } = calculateDimensions(targetSize);

        canvas.width = width;
        canvas.height = height;

        // Create live preview
        const livePreview = createLivePreview(format);

        // Draw image
        ctx.drawImage(currentImage.img, 0, 0, width, height);

        // Show live preview immediately
        livePreview.src = canvas.toDataURL();

        // Convert based on format
        let mimeType,
          quality = 1;
        switch (format) {
          case "png":
            mimeType = "image/png";
            break;
          case "jpeg":
            mimeType = "image/jpeg";
            quality = document.getElementById("jpegQuality").value / 100;
            break;
          case "webp":
            mimeType = "image/webp";
            quality = 0.85;
            break;
          case "gif":
            mimeType = "image/png"; // Fallback for static GIF conversion
            break;
        }

        canvas.toBlob(
          (blob) => {
            hideProgress();
            addConversionResult(format, blob, canvas, targetSize, livePreview);
            showSuccess(`Successfully converted to ${format.toUpperCase()}!`);
            resolve();
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    }, 100);
  });
}

// Enhanced GIF conversion with frame processing
async function convertGifImage(format) {
  // Check if GIF libraries are available
  if (!checkGifLibraries()) {
    throw new Error("GIF processing libraries not available");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const buffer = e.target.result;
        const gif = new window.GifuctJS.Gif(new Uint8Array(buffer));
        const frames = gif.decompressFrames(true);

        if (!frames || frames.length === 0) {
          throw new Error("Could not process GIF frames");
        }

        // Create live preview with first frame
        const livePreview = createLivePreview(format);
        const canvasPreview = document.createElement("canvas");
        canvasPreview.width = frames[0].dims.width;
        canvasPreview.height = frames[0].dims.height;
        const ctx = canvasPreview.getContext("2d");
        const imageData = ctx.createImageData(
          frames[0].dims.width,
          frames[0].dims.height
        );
        imageData.data.set(frames[0].patch);
        ctx.putImageData(imageData, 0, 0);
        livePreview.src = canvasPreview.toDataURL();

        // Calculate target dimensions
        const targetSize = selectedSizes[format];
        let { width, height } = calculateDimensions(
          targetSize,
          frames[0].dims.width,
          frames[0].dims.height
        );

        // Create GIF encoder with better settings
        const gifEncoder = new GIF({
          workers: Math.min(2, navigator.hardwareConcurrency || 2),
          quality: 10,
          width: width,
          height: height,
          transparent: null,
          dithering: false,
          workerScript:
            "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js",
        });

        // Update status
        const statusElement =
          livePreview.parentElement.querySelector("p:last-child");
        statusElement.textContent = `Processing ${frames.length} frames...`;

        // Process each frame with proper error handling
        let processedFrames = 0;
        frames.forEach((frame, index) => {
          try {
            const canvasFrame = document.createElement("canvas");
            canvasFrame.width = width;
            canvasFrame.height = height;
            const ctxFrame = canvasFrame.getContext("2d");

            // Create original frame
            const originalCanvas = document.createElement("canvas");
            originalCanvas.width = frame.dims.width;
            originalCanvas.height = frame.dims.height;
            const originalCtx = originalCanvas.getContext("2d");
            const imgData = originalCtx.createImageData(
              frame.dims.width,
              frame.dims.height
            );
            imgData.data.set(frame.patch);
            originalCtx.putImageData(imgData, 0, 0);

            // Scale to target size
            ctxFrame.drawImage(originalCanvas, 0, 0, width, height);

            gifEncoder.addFrame(ctxFrame, {
              copy: true,
              delay: Math.max(frame.delay || 100, 50), // Ensure minimum delay
            });

            processedFrames++;
            statusElement.textContent = `Processing frame ${processedFrames}/${frames.length}...`;
          } catch (frameError) {
            console.warn(`Error processing frame ${index}:`, frameError);
          }
        });

        gifEncoder.on("finished", function (blob) {
          hideProgress();
          addConversionResult(format, blob, null, targetSize, livePreview);
          showSuccess(
            `Successfully converted GIF with ${
              frames.length
            } frames to ${format.toUpperCase()}!`
          );
          resolve();
        });

        gifEncoder.on("progress", function (p) {
          updateProgress(p * 100);
          if (statusElement) {
            statusElement.textContent = `Encoding GIF: ${Math.round(p * 100)}%`;
          }
        });

        gifEncoder.on("abort", function () {
          hideProgress();
          reject(new Error("GIF encoding was aborted"));
        });

        // Start rendering
        gifEncoder.render();
      } catch (error) {
        hideProgress();
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read GIF file"));
    reader.readAsArrayBuffer(currentImage.file);
  });
}

// Create live preview element
function createLivePreview(format) {
  const resultsContainer = document.getElementById("conversionResults");

  const resultItem = document.createElement("div");
  resultItem.className = "preview-item";

  const title = document.createElement("h4");
  title.textContent = `Converting to ${format.toUpperCase()}...`;
  resultItem.appendChild(title);

  const livePreview = document.createElement("img");
  livePreview.className = "preview-canvas";
  livePreview.style.maxWidth = "150px";
  livePreview.style.maxHeight = "150px";
  livePreview.style.border = "2px dashed #10b981";
  resultItem.appendChild(livePreview);

  const statusText = document.createElement("p");
  statusText.textContent = "Processing...";
  statusText.style.color = "#10b981";
  resultItem.appendChild(statusText);

  resultsContainer.appendChild(resultItem);

  return livePreview;
}

// Calculate dimensions based on target size (enhanced for GIF support)
function calculateDimensions(
  targetSize,
  originalWidth = null,
  originalHeight = null
) {
  const imgWidth = originalWidth || currentImage.img.width;
  const imgHeight = originalHeight || currentImage.img.height;

  if (targetSize === "original") {
    return { width: imgWidth, height: imgHeight };
  }

  const [targetWidth, targetHeight] = targetSize.split("x").map(Number);
  const aspectRatio = imgWidth / imgHeight;

  let width, height;
  if (aspectRatio > targetWidth / targetHeight) {
    width = targetWidth;
    height = Math.round(targetWidth / aspectRatio);
  } else {
    height = targetHeight;
    width = Math.round(targetHeight * aspectRatio);
  }

  return { width, height };
}

// Add conversion result to display (enhanced with live preview support)
function addConversionResult(
  format,
  blob,
  canvas = null,
  size,
  livePreview = null
) {
  let resultItem;

  if (livePreview && livePreview.parentElement) {
    // Update existing live preview container
    resultItem = livePreview.parentElement;

    // Update the live preview with final result
    livePreview.src = URL.createObjectURL(blob);
    livePreview.style.border = "1px solid #ddd";

    // Update title
    const title = resultItem.querySelector("h4");
    title.textContent = `${format.toUpperCase()} - Converted`;

    // Update status
    const statusText = resultItem.querySelector("p");
    statusText.textContent = `Size: ${
      size === "original" ? "Original" : size
    } | File Size: ${formatFileSize(blob.size)}`;
    statusText.style.color = "#666";
  } else {
    // Create new result item (fallback)
    const resultsContainer = document.getElementById("conversionResults");

    resultItem = document.createElement("div");
    resultItem.className = "preview-item";

    const previewCanvas = canvas
      ? canvas.cloneNode(true)
      : document.createElement("img");
    if (canvas) {
      previewCanvas.className = "preview-canvas";
      previewCanvas.style.maxWidth = "150px";
      previewCanvas.style.maxHeight = "150px";
    } else {
      previewCanvas.src = URL.createObjectURL(blob);
      previewCanvas.className = "preview-canvas";
      previewCanvas.style.maxWidth = "150px";
      previewCanvas.style.maxHeight = "150px";
    }

    resultItem.innerHTML = `
      <h4>${format.toUpperCase()}</h4>
      <p>Size: ${size === "original" ? "Original" : size}</p>
      <p>File Size: ${formatFileSize(blob.size)}</p>
    `;

    resultItem.insertBefore(
      previewCanvas,
      resultItem.querySelector("h4").nextSibling
    );

    resultsContainer.appendChild(resultItem);
  }

  // Add or update download button
  let downloadBtn = resultItem.querySelector(".btn");
  if (!downloadBtn) {
    downloadBtn = document.createElement("button");
    downloadBtn.className = "btn";
    resultItem.appendChild(downloadBtn);
  }

  downloadBtn.textContent = "Download";
  downloadBtn.onclick = () => {
    const filename =
      currentImage.file.name.replace(/\.[^/.]+$/, "") + `.${format}`;
    downloadBlob(blob, filename);
  };

  // Store result
  conversionResults.push({ format, blob, size });
}

// Icon generation functions
function processIconFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      currentImage = { file, img, data: e.target.result };
      document.getElementById("customIconBtn").style.display = "inline-block";
      showSuccess("Custom image loaded! You can now generate custom icons.");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function generateDefaultIcons() {
  const iconSizes = [
    { size: 16, name: "icon-16.png" },
    { size: 32, name: "icon-32.png" },
    { size: 192, name: "icon-192.png" },
    { size: 512, name: "icon-512.png" },
    { size: 192, name: "icon-maskable-192.png", maskable: true },
    { size: 512, name: "icon-maskable-512.png", maskable: true },
  ];

  const resultsContainer = document.getElementById("iconResults");
  resultsContainer.innerHTML = "<h3>Generated PWA Icons:</h3>";

  iconSizes.forEach((iconInfo) => {
    const iconItem = document.createElement("div");
    iconItem.className = "preview-item";

    const canvas = document.createElement("canvas");
    canvas.width = iconInfo.size;
    canvas.height = iconInfo.size;
    const ctx = canvas.getContext("2d");

    drawDefaultIcon(
      ctx,
      iconInfo.size,
      iconInfo.maskable ? iconInfo.size * 0.1 : 0
    );

    const previewCanvas = canvas.cloneNode(true);
    previewCanvas.className = "preview-canvas";
    previewCanvas.style.width = "80px";
    previewCanvas.style.height = "80px";

    iconItem.innerHTML = `
                    <h4>${iconInfo.name}</h4>
                    <p>${iconInfo.size}×${iconInfo.size}px</p>
                    ${
                      iconInfo.maskable
                        ? '<p style="color: #10b981;">Maskable</p>'
                        : ""
                    }
                `;

    iconItem.insertBefore(
      previewCanvas,
      iconItem.querySelector("h4").nextSibling
    );

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn";
    downloadBtn.textContent = "Download";
    downloadBtn.onclick = () => {
      canvas.toBlob((blob) => {
        downloadBlob(blob, iconInfo.name);
      }, "image/png");
    };

    iconItem.appendChild(downloadBtn);
    resultsContainer.appendChild(iconItem);
  });
}

function generateCustomIcons() {
  if (!currentImage) {
    showError("Please upload a custom image first.");
    return;
  }

  const iconSizes = [
    { size: 16, name: "custom-icon-16.png" },
    { size: 32, name: "custom-icon-32.png" },
    { size: 192, name: "custom-icon-192.png" },
    { size: 512, name: "custom-icon-512.png" },
    { size: 192, name: "custom-icon-maskable-192.png", maskable: true },
    { size: 512, name: "custom-icon-maskable-512.png", maskable: true },
  ];

  const resultsContainer = document.getElementById("iconResults");
  resultsContainer.innerHTML = "<h3>Generated Custom Icons:</h3>";

  iconSizes.forEach((iconInfo) => {
    const iconItem = document.createElement("div");
    iconItem.className = "preview-item";

    const canvas = document.createElement("canvas");
    canvas.width = iconInfo.size;
    canvas.height = iconInfo.size;
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 0, iconInfo.size, iconInfo.size);

    // Calculate image size with padding for maskable icons
    const padding = iconInfo.maskable
      ? iconInfo.size * 0.1
      : iconInfo.size * 0.05;
    const imageSize = iconInfo.size - padding * 2;

    // Draw custom image centered
    ctx.drawImage(currentImage.img, padding, padding, imageSize, imageSize);

    const previewCanvas = canvas.cloneNode(true);
    previewCanvas.className = "preview-canvas";
    previewCanvas.style.width = "80px";
    previewCanvas.style.height = "80px";

    iconItem.innerHTML = `
                    <h4>${iconInfo.name}</h4>
                    <p>${iconInfo.size}×${iconInfo.size}px</p>
                    ${
                      iconInfo.maskable
                        ? '<p style="color: #10b981;">Maskable</p>'
                        : ""
                    }
                `;

    iconItem.insertBefore(
      previewCanvas,
      iconItem.querySelector("h4").nextSibling
    );

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn";
    downloadBtn.textContent = "Download";
    downloadBtn.onclick = () => {
      canvas.toBlob((blob) => {
        downloadBlob(blob, iconInfo.name);
      }, "image/png");
    };

    iconItem.appendChild(downloadBtn);
    resultsContainer.appendChild(iconItem);
  });
}

// Draw default Oracle Mode icon
function drawDefaultIcon(ctx, size, padding) {
  const center = size / 2;
  const radius = (size - padding * 2) / 2;

  // Create gradient background
  const gradient = ctx.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    radius
  );
  gradient.addColorStop(0, "#10b981");
  gradient.addColorStop(1, "#059669");

  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw circles
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = Math.max(1, size / 256);
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.8, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.6, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw eye
  const eyeWidth = radius * 0.6;
  const eyeHeight = radius * 0.3;

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.ellipse(center, center, eyeWidth, eyeHeight, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Pupil
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.25, 0, 2 * Math.PI);
  ctx.fill();

  // Iris
  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.15, 0, 2 * Math.PI);
  ctx.fill();

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(
    center + radius * 0.05,
    center - radius * 0.05,
    radius * 0.08,
    0,
    2 * Math.PI
  );
  ctx.fill();

  // Text (only for larger icons)
  if (size >= 192) {
    ctx.fillStyle = "white";
    ctx.font = `bold ${size * 0.06}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("ORACLE", center, center + radius * 1.2);

    ctx.font = `${size * 0.04}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("MODE", center, center + radius * 1.4);
  }
}

// Batch processing functions
function processBatchFiles(files) {
  batchFiles = files.filter((file) => file.type.startsWith("image/"));

  if (batchFiles.length === 0) {
    showError("No valid image files found.");
    return;
  }

  document.getElementById("batchControls").style.display = "block";
  showSuccess(`${batchFiles.length} images ready for batch processing.`);

  const resultsContainer = document.getElementById("batchResults");
  resultsContainer.innerHTML = "<h3>Batch Queue:</h3>";

  batchFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    item.innerHTML = `
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                    <p>Status: Ready</p>
                `;
    resultsContainer.appendChild(item);
  });
}

// Enhanced batch processing with GIF support
function processBatch() {
  const format = document.getElementById("batchFormat").value;
  const size = document.getElementById("batchSize").value;
  const resultsContainer = document.getElementById("batchResults");

  let processed = 0;
  const total = batchFiles.length;

  showProgress();
  updateProgress(0);

  // Process files sequentially to avoid overwhelming the browser
  processBatchFile(0, format, size, resultsContainer, processed, total);
}

async function processBatchFile(
  index,
  format,
  size,
  resultsContainer,
  processed,
  total
) {
  if (index >= batchFiles.length) {
    hideProgress();
    showSuccess("Batch processing completed!");
    return;
  }

  const file = batchFiles[index];

  try {
    // Create temporary current image for processing
    const tempCurrentImage = currentImage;

    if (file.type === "image/gif" && format === "gif") {
      // Handle GIF to GIF conversion
      await processBatchGif(file, format, size, index, resultsContainer);
    } else {
      // Handle static image conversion
      await processBatchStatic(file, format, size, index, resultsContainer);
    }

    // Restore original current image
    currentImage = tempCurrentImage;
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    updateBatchItemStatus(index, resultsContainer, "Error", "#dc2626");
  }

  processed++;
  updateProgress((processed / total) * 100);

  // Process next file after a small delay
  setTimeout(() => {
    processBatchFile(
      index + 1,
      format,
      size,
      resultsContainer,
      processed,
      total
    );
  }, 100);
}

async function processBatchStatic(file, format, size, index, resultsContainer) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Set up temporary current image
        currentImage = { file, img, data: e.target.result };

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate dimensions using the enhanced function
        let width, height;
        if (size === "original") {
          width = img.width;
          height = img.height;
        } else {
          const dimensions = calculateDimensions(size, img.width, img.height);
          width = dimensions.width;
          height = dimensions.height;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;
        canvas.toBlob(
          (blob) => {
            updateBatchItemStatus(
              index,
              resultsContainer,
              "Completed",
              "#10b981"
            );
            addBatchDownloadButton(
              index,
              resultsContainer,
              blob,
              file.name,
              format
            );
            resolve();
          },
          mimeType,
          format === "jpeg" ? 0.85 : 1
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function processBatchGif(file, format, size, index, resultsContainer) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const buffer = e.target.result;
        const gif = new window.GifuctJS.Gif(new Uint8Array(buffer));
        const frames = gif.decompressFrames(true);

        if (!frames || frames.length === 0) {
          throw new Error("Could not process GIF frames");
        }

        // Calculate target dimensions
        let width, height;
        if (size === "original") {
          width = frames[0].dims.width;
          height = frames[0].dims.height;
        } else {
          const dimensions = calculateDimensions(
            size,
            frames[0].dims.width,
            frames[0].dims.height
          );
          width = dimensions.width;
          height = dimensions.height;
        }

        const gifEncoder = new GIF({
          workers: 1, // Use fewer workers for batch processing
          quality: 10,
          width: width,
          height: height,
        });

        frames.forEach((frame) => {
          const canvasFrame = document.createElement("canvas");
          canvasFrame.width = width;
          canvasFrame.height = height;
          const ctxFrame = canvasFrame.getContext("2d");

          const originalCanvas = document.createElement("canvas");
          originalCanvas.width = frame.dims.width;
          originalCanvas.height = frame.dims.height;
          const originalCtx = originalCanvas.getContext("2d");
          const imgData = originalCtx.createImageData(
            frame.dims.width,
            frame.dims.height
          );
          imgData.data.set(frame.patch);
          originalCtx.putImageData(imgData, 0, 0);

          ctxFrame.drawImage(originalCanvas, 0, 0, width, height);
          gifEncoder.addFrame(ctxFrame, {
            copy: true,
            delay: frame.delay || 100,
          });
        });

        gifEncoder.on("finished", function (blob) {
          updateBatchItemStatus(
            index,
            resultsContainer,
            "Completed",
            "#10b981"
          );
          addBatchDownloadButton(
            index,
            resultsContainer,
            blob,
            file.name,
            format
          );
          resolve();
        });

        gifEncoder.render();
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function updateBatchItemStatus(index, resultsContainer, status, color) {
  const items = resultsContainer.querySelectorAll(".preview-item");
  const item = items[index + 1]; // +1 because first item is header
  if (item) {
    const statusP = item.querySelector("p:last-child");
    statusP.textContent = `Status: ${status}`;
    statusP.style.color = color;
  }
}

function addBatchDownloadButton(
  index,
  resultsContainer,
  blob,
  originalFilename,
  format
) {
  const items = resultsContainer.querySelectorAll(".preview-item");
  const item = items[index + 1];
  if (item && !item.querySelector(".btn")) {
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn";
    downloadBtn.textContent = "Download";
    downloadBtn.onclick = () => {
      const filename = originalFilename.replace(/\.[^/.]+$/, "") + "." + format;
      downloadBlob(blob, filename);
    };
    item.appendChild(downloadBtn);
  }
}

function downloadAllBatch() {
  showError(
    "ZIP download functionality requires a server-side implementation."
  );
}

// Utility functions
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showProgress() {
  document.getElementById("progressBar").style.display = "block";
}

function hideProgress() {
  document.getElementById("progressBar").style.display = "none";
}

function updateProgress(percent) {
  document.getElementById("progressFill").style.width = percent + "%";
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document
    .querySelector(".main-content")
    .insertBefore(errorDiv, document.querySelector(".tabs").nextSibling);
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  document
    .querySelector(".main-content")
    .insertBefore(successDiv, document.querySelector(".tabs").nextSibling);
  setTimeout(() => successDiv.remove(), 5000);
}
