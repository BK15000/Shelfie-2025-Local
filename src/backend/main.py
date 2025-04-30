from http.client import HTTPException
import os
from fastapi import FastAPI, File, UploadFile, Request, Header
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from sqlite3 import Error
import io
from segment_anything import sam_model_registry, SamPredictor, SamAutomaticMaskGenerator, sam_model_registry # type: ignore
import numpy as np # type: ignore
import cv2 # type: ignore
import torch # type: ignore
import warnings
import base64
from fastapi.responses import JSONResponse, HTMLResponse
import easyocr # type: ignore
from AIAPI import AIAPI
from typing import List, Dict, Any, Optional

warnings.simplefilter(action='ignore', category=FutureWarning)

# Initialize EasyOCR reader
global reader
reader = easyocr.Reader(['en'])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - you can restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
Initialize the Segment Anything Model (SAM) with the following settings:
- Uses the ViT-H architecture
- Loads weights from sam_vit_b_01ec64.pth
- Automatically selects GPU if available, otherwise CPU
"""
# CHECKPOINT_PATH = "sam_vit_b_01ec64.pth"
CHECKPOINT_PATH= "sam_vit_l_0b3195.pth"
# CHECKPOINT_PATH= "sam_vit_h_4b8939.pth"
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
# if torch.cuda.is_available(): print("CUDA is available")
# else: print("CUDA is NOT available")

# sam = sam_model_registry["vit_b"](checkpoint=CHECKPOINT_PATH)
sam = sam_model_registry["vit_l"](checkpoint=CHECKPOINT_PATH)
# sam = sam_model_registry["vit_h"](checkpoint=CHECKPOINT_PATH)
sam.to(device=DEVICE)
predictor = SamPredictor(sam)


def create_connection():
    """
    Creates and returns a SQLite database connection.
    
    Returns:
        sqlite3.Connection: Database connection object or None if connection fails
    """
    conn = None
    try:
        conn = sqlite3.connect('/app/data/images.db')
        return conn
    except Error as e:
        print(e)
    return conn

def calculate_iou(mask1, mask2):
    """
    Calculate Intersection over Union (IoU) between two binary masks.
    
    Args:
        mask1 (numpy.ndarray): First binary mask
        mask2 (numpy.ndarray): Second binary mask
        
    Returns:
        float: IoU value between 0 and 1
    """
    intersection = np.logical_and(mask1, mask2).sum()
    union = np.logical_or(mask1, mask2).sum()
    
    if union == 0:
        return 0
    
    return intersection / union

def process_image_with_sam(image_data):
    """
    Processes an image using the SAM model to generate segmentation masks.
    Filters out masks that are too small based on a minimum area threshold.
    
    Args:
        image_data (bytes): Raw image data in bytes
        
    Returns:
        list: Filtered masks
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Resize large images to manageable size
    max_size = 1024
    height, width = image.shape[:2]
    if height > max_size or width > max_size:
        scale = max_size / max(height, width)
        image = cv2.resize(image, (int(width * scale), int(height * scale)))
    
    # Configure mask generator with memory-efficient settings
    mask_generator = SamAutomaticMaskGenerator(
        sam,
    points_per_side=46,           # Reduce from 32 to focus on larger objects
    points_per_batch=64,          # Keep as is for processing efficiency
    pred_iou_thresh=0.9,         # Increase from 0.88 for more precise masks
    stability_score_thresh=0.94,  # Increase from 0.94 for more stable masks
    stability_score_offset=1,     # Keep as is
    box_nms_thresh=0.92,           # Increase from 0.5 to reduce overlapping boxes
    crop_n_layers=1,              # Keep as is for shelf images
    crop_nms_thresh=0.92,          # Increase from 0.5 to reduce overlapping regions
    min_mask_region_area=500      # Increase significantly to filter tiny segments

    )
    
    masks = mask_generator.generate(image)
    
    # Filter out small masks based on area
    min_area_threshold = 4000  # Minimum area in pixels (e.g., 30x30)
    area_filtered_masks = [mask for mask in masks if np.sum(mask['segmentation']) >= min_area_threshold]
    
    # Handle overlapping masks with improved subsection and stacking detection
    overlap_threshold = 0.3  # Base IoU threshold
    containment_threshold = 0.85  # Higher threshold for determining if one mask is contained within another
    
    # Sort masks by stability score first, then by area (ascending)
    # This helps ensure we keep the most stable segments while still processing smaller ones first
    sorted_masks = sorted(area_filtered_masks, 
                         key=lambda x: (-x.get('stability_score', 0.0), np.sum(x['segmentation'])))
    
    # Initialize list to track which masks to keep
    masks_to_keep = []
    
    # For each mask, check if it overlaps significantly with any previously kept mask
    for i, mask in enumerate(sorted_masks):
        should_keep = True
        
        # Get current mask segmentation and properties
        current_mask = mask['segmentation']
        current_area = np.sum(current_mask)
        current_stability = mask.get('stability_score', 0.0)
        
        # Get bounding box for current mask
        current_indices = np.where(current_mask)
        if len(current_indices[0]) == 0:  # Skip empty masks
            continue
            
        current_y_min, current_y_max = np.min(current_indices[0]), np.max(current_indices[0])
        current_x_min, current_x_max = np.min(current_indices[1]), np.max(current_indices[1])
        current_height = current_y_max - current_y_min
        current_width = current_x_max - current_x_min
        current_aspect_ratio = current_width / current_height if current_height > 0 else 0
        
        # Check against all previously kept masks
        for kept_idx in masks_to_keep:
            kept_mask = sorted_masks[kept_idx]['segmentation']
            kept_stability = sorted_masks[kept_idx].get('stability_score', 0.0)
            
            # Get bounding box for kept mask
            kept_indices = np.where(kept_mask)
            kept_y_min, kept_y_max = np.min(kept_indices[0]), np.max(kept_indices[0])
            kept_x_min, kept_x_max = np.min(kept_indices[1]), np.max(kept_indices[1])
            kept_height = kept_y_max - kept_y_min
            kept_width = kept_x_max - kept_x_min
            kept_aspect_ratio = kept_width / kept_height if kept_height > 0 else 0
            kept_area = np.sum(kept_mask)
            
            # Calculate basic overlap metrics first
            overlap_region = np.logical_and(current_mask, kept_mask)
            intersection = np.sum(overlap_region)
            iou = calculate_iou(current_mask, kept_mask)
            
            # If there's no overlap at all, skip further checks
            if intersection == 0:
                is_stacked = False
                is_subsection = False
                continue
                
            # Calculate overlap indices and metrics
            overlap_indices = np.where(overlap_region)
            overlap_y_min, overlap_y_max = np.min(overlap_indices[0]), np.max(overlap_indices[0])
            
            # Calculate overlap dimensions
            overlap_height = overlap_y_max - overlap_y_min
            overlap_width = overlap_indices[1].max() - overlap_indices[1].min()
            
            # Initialize overlap metrics
            current_top_overlap = current_bottom_overlap = kept_top_overlap = kept_bottom_overlap = 0
            current_left_overlap = current_right_overlap = kept_left_overlap = kept_right_overlap = 0
            total_vertical_overlap = total_horizontal_overlap = 0
            max_vertical_overlap = max_side_overlap = 0
            
            # Calculate vertical overlap metrics if significant height
            if overlap_height >= 5:
                # Calculate vertical overlap ratios
                current_top_overlap = max(0, current_y_min + current_height/4 - overlap_y_min) / overlap_height
                current_bottom_overlap = max(0, overlap_y_max - (current_y_max - current_height/4)) / overlap_height
                kept_top_overlap = max(0, kept_y_min + kept_height/4 - overlap_y_min) / overlap_height
                kept_bottom_overlap = max(0, overlap_y_max - (kept_y_max - kept_height/4)) / overlap_height
                
                # Calculate vertical overlap characteristics
                total_vertical_overlap = current_top_overlap + current_bottom_overlap + kept_top_overlap + kept_bottom_overlap
                max_vertical_overlap = max(current_top_overlap, current_bottom_overlap, kept_top_overlap, kept_bottom_overlap)
            
            # Calculate horizontal overlap metrics if significant width
            if overlap_width >= 5:
                # Calculate horizontal overlap ratios
                current_left_overlap = max(0, current_x_min + current_width/4 - overlap_indices[1].min()) / overlap_width
                current_right_overlap = max(0, overlap_indices[1].max() - (current_x_max - current_width/4)) / overlap_width
                kept_left_overlap = max(0, kept_x_min + kept_width/4 - overlap_indices[1].min()) / overlap_width
                kept_right_overlap = max(0, overlap_indices[1].max() - (kept_x_max - kept_width/4)) / overlap_width
                
                # Calculate horizontal overlap characteristics
                total_horizontal_overlap = current_left_overlap + current_right_overlap + kept_left_overlap + kept_right_overlap
                max_side_overlap = max(current_left_overlap, current_right_overlap, kept_left_overlap, kept_right_overlap)
            
            # Calculate horizontal alignment
            horizontal_overlap = max(0, min(current_x_max, kept_x_max) - max(current_x_min, kept_x_min))
            horizontal_overlap_ratio = horizontal_overlap / min(current_width, kept_width)
            
            # Calculate containment ratios
            current_in_kept_ratio = intersection / current_area
            kept_in_current_ratio = intersection / kept_area
            
            # Check if overlap is more horizontal than vertical
            # Consider both total distribution and peak concentration
            horizontal_bias = (
                (total_horizontal_overlap > total_vertical_overlap * 1.2 and  # Require 20% more horizontal overlap
                 max_side_overlap > 0.5) or  # Must have significant side overlap
                (max_side_overlap > 0.7 and  # Strong side concentration
                 max_side_overlap > max_vertical_overlap * 1.3 and  # Much stronger than vertical
                 abs(current_left_overlap - current_right_overlap) > 0.4)  # Concentrated on one side
            )
            
            # Check for nearly identical segments
            # Calculate bounding box similarity
            box_overlap_x = min(current_x_max, kept_x_max) - max(current_x_min, kept_x_min)
            box_overlap_y = min(current_y_max, kept_y_max) - max(current_y_min, kept_y_min)
            box_overlap_area = box_overlap_x * box_overlap_y
            box_union_area = (max(current_x_max, kept_x_max) - min(current_x_min, kept_x_min)) * \
                            (max(current_y_max, kept_y_max) - min(current_y_min, kept_y_min))
            box_iou = box_overlap_area / box_union_area if box_union_area > 0 else 0

            # Consider segments nearly identical if:
            # - High IoU (> 0.65) or high containment ratio (> 0.65)
            # - Similar bounding boxes (box_iou > 0.7)
            # - Similar center position (within 10% of box size)
            center_x_diff = abs((current_x_min + current_x_max) / 2 - (kept_x_min + kept_x_max) / 2)
            center_y_diff = abs((current_y_min + current_y_max) / 2 - (kept_y_min + kept_y_max) / 2)
            max_dim = max(current_width, current_height, kept_width, kept_height)
            centers_close = (center_x_diff < max_dim * 0.1 and center_y_diff < max_dim * 0.1)
            
            if ((iou > 0.65 or current_in_kept_ratio > 0.65 or kept_in_current_ratio > 0.65) and
                box_iou > 0.7 and centers_close):
                # Keep the more stable one
                should_keep = current_stability >= kept_stability
                break
            
            # Check for subsections with more comprehensive criteria
            is_subsection = False
            
            # First check if one segment is significantly contained within the other
            if (current_in_kept_ratio > containment_threshold and current_area < kept_area * 0.9) or \
               (kept_in_current_ratio > containment_threshold and kept_area < current_area * 0.9):
                
                # Then check if it's likely a subsection based on overlap distribution
                if horizontal_bias:
                    # If there's strong horizontal bias, it's likely a subsection
                    is_subsection = True
                else:
                    # Check if the overlap is evenly distributed (not concentrated at top/bottom)
                    even_vertical_distribution = (
                        abs(current_top_overlap - current_bottom_overlap) < 0.3 and
                        abs(kept_top_overlap - kept_bottom_overlap) < 0.3
                    )
                    
                    # If overlap is even and not concentrated on one side, it's likely a subsection
                    if even_vertical_distribution and \
                       abs(current_left_overlap - current_right_overlap) < 0.3 and \
                       abs(kept_left_overlap - kept_right_overlap) < 0.3:
                        is_subsection = True
            
            # Check if this might be a combined segment of stacked boxes
            # Only check if not a subsection and overlap is more vertical than horizontal
            is_combined_segment = (
                not is_subsection and
                not horizontal_bias and
                current_area > kept_area * 1.4 and  # Slightly lower threshold for combined segments
                horizontal_overlap_ratio > 0.5 and  # More lenient horizontal alignment
                current_height > kept_height * 1.6 and  # Should be significantly taller
                current_stability < kept_stability and  # Individual segments should be more stable
                ((current_top_overlap > 0.6 and current_bottom_overlap > 0.6) or  # Contains both top and bottom
                 (kept_top_overlap > 0.6 and kept_bottom_overlap > 0.6))  # Contains both top and bottom
            )
            
            # Only check for stacking if it's not a subsection and not a combined segment
            is_stacked = False
            if not is_subsection and not is_combined_segment:
                # Calculate relative size - stacked boxes should be similar in size
                size_ratio = min(current_area, kept_area) / max(current_area, kept_area)
                width_ratio = min(current_width, kept_width) / max(current_width, kept_width)
                
                is_stacked = (
                    horizontal_overlap_ratio > 0.5 and  # More lenient horizontal alignment
                    abs(current_aspect_ratio - kept_aspect_ratio) < 0.4 and  # More lenient aspect ratio difference
                    size_ratio > 0.6 and  # More lenient size ratio
                    width_ratio > 0.7 and  # Similar widths
                    iou < overlap_threshold and  # Limited overall overlap
                    ((current_top_overlap > 0.6 and current_bottom_overlap < 0.2) or  # More lenient overlap thresholds
                     (current_bottom_overlap > 0.6 and current_top_overlap < 0.2) or
                     (kept_top_overlap > 0.6 and kept_bottom_overlap < 0.2) or
                     (kept_bottom_overlap > 0.6 and kept_top_overlap < 0.2))
                )
            
            # Determine if we should keep this mask
            if is_combined_segment:
                # Don't keep combined segments of stacked boxes
                should_keep = False
                break
            elif is_subsection:
                # For subsections, always keep the larger mask
                if current_area < kept_area:
                    should_keep = False
                    break
            elif not is_stacked and iou > overlap_threshold:
                # For overlapping non-stacked masks, keep the one with better stability
                if current_stability < kept_stability:
                    should_keep = False
                    break
            elif is_stacked:
                # For stacked boxes, keep both unless they're too similar
                if iou > 0.8:  # Very high overlap suggests same box
                    should_keep = False
                    break
        
        # Add to keep list if it passed all checks
        if should_keep:
            masks_to_keep.append(i)
    
    # Get the filtered masks
    filtered_masks = [sorted_masks[i] for i in masks_to_keep]
    
    # Additional pass to remove enveloped segments
    # Sort by area descending so we check larger segments first
    filtered_masks.sort(key=lambda x: np.sum(x['segmentation']), reverse=True)
    masks_to_remove = set()
    
    # Compare each pair of masks
    for i in range(len(filtered_masks)):
        if i in masks_to_remove:
            continue
        mask1 = filtered_masks[i]['segmentation']
        area1 = np.sum(mask1)
        
        for j in range(i + 1, len(filtered_masks)):
            if j in masks_to_remove:
                continue
            mask2 = filtered_masks[j]['segmentation']
            area2 = np.sum(mask2)
            
            # Calculate intersection
            intersection = np.logical_and(mask1, mask2).sum()
            
            # If smaller mask is completely or almost completely (90%) contained within larger mask
            # and the larger mask is at least 50% bigger
            if area1 > area2 * 1.5:  # Larger mask is at least 50% bigger
                if intersection / area2 > 0.9:  # 90% of smaller mask is contained
                    masks_to_remove.add(j)
            elif area2 > area1 * 1.5:  # Smaller mask is at least 50% bigger
                if intersection / area1 > 0.9:  # 90% of smaller mask is contained
                    masks_to_remove.add(i)
                    break  # No need to check this mask against others
    
    # Return masks that weren't removed
    final_masks = [mask for i, mask in enumerate(filtered_masks) if i not in masks_to_remove]
    return final_masks


def get_filtered_segments(image_id: int):
    """
    Helper function to get filtered segments with text for a given image.
    
    Args:
        image_id (int): ID of the image to process
        
    Returns:
        list: List of filtered segments with text
    """
    filtered_segments = []
    segments_data = []
    conn = create_connection()
    
    if not conn:
        return filtered_segments
        
    try:
        cursor = conn.cursor()
        
        # Retrieve original image data
        cursor.execute("SELECT data FROM images WHERE id=?", (image_id,))
        image_row = cursor.fetchone()
        
        # Retrieve all segments for the given image ID
        cursor.execute("""
            SELECT id, mask_path, mask_width, mask_height, confidence 
            FROM segments WHERE image_id=?
        """, (image_id,))
        segment_rows = cursor.fetchall()
        
        if not image_row or not segment_rows:
            return filtered_segments
            
        # Decode the original image
        nparr = np.frombuffer(image_row[0], np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        height, width = image.shape[:2]
        
        # Process all masks
        for seg_id, mask_path, mask_width, mask_height, confidence in segment_rows:
            # Load mask from file
            mask = np.load(mask_path)
            
            # Resize the mask to match the original image dimensions
            resized_mask = cv2.resize(mask.astype(np.uint8), (width, height), interpolation=cv2.INTER_NEAREST).astype(bool)
            
            # Create a blank canvas for the masked region
            segment_image = np.zeros_like(image)
            segment_image[resized_mask] = image[resized_mask]
            
            # Encode as base64
            _, buffer = cv2.imencode('.png', segment_image)
            base64_image = base64.b64encode(buffer).decode('utf-8')
            
            segments_data.append([seg_id, base64_image])
        
        print("starting text checker...")
        for segment in segments_data:
            tmpSegment = segment[1]
            image_data = base64.b64decode(tmpSegment)
            
            #make image be readable by Easyocr
            nparr = np.frombuffer(image_data, np.uint8)

            # Decode image using OpenCV
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            image = cv2.resize(image, (800, 800))
            
            result = reader.readtext(image)
            print("checking confidence")
            for item in result:
                if isinstance(item, tuple) and len(item) == 3:  # Ensure valid tuple
                    bbox, text, confidence = item
                    if isinstance(confidence, (float, int)) and confidence > 0.0:
                        filtered_segments.append({
                            "seg_id": segment[0], 
                            "base64_image": segment[1], 
                            "confidence": confidence
                        })
                        break
        
        return filtered_segments
    finally:
        conn.close()


@app.post("/process_image")
async def process_image(
    file: UploadFile = File(...), 
    request: Request = None, 
    x_openai_api_key: str = Header(None)
):
    """
    Combined endpoint that handles the entire image processing pipeline:
    1. Upload the image
    2. Segment it using SAM
    3. Clean it (filter segments with text)
    4. Identify the games
    5. Return the segment data as expected by the frontend
    
    Args:
        file (UploadFile): Image file to be uploaded
        request (Request): The FastAPI request object
        x_openai_api_key (str): OpenAI API key from header
        
    Returns:
        JSONResponse: Contains image_id and list of processed segments with:
            - id: segment identifier
            - confidence: OCR confidence score
            - image: base64 encoded PNG of the segmented region
            - name: identified game name
    """
    
    # Step 1: Upload and read the image
    contents = await file.read()
    conn = create_connection()
    
    if not conn:
        return JSONResponse({"error": "Database connection failed"}, status_code=500)
    
    try:
        cursor = conn.cursor()
        
        # Insert image into the database
        cursor.execute("INSERT INTO images (name, data) VALUES (?, ?)", 
                       (file.filename, contents))
        image_id = cursor.lastrowid
        
        # Step 2: Process the image with SAM to generate masks
        print("Segmenting image...")
        masks = process_image_with_sam(contents)
        
        # Create segments directory if it doesn't exist
        if not os.path.exists('/app/data/segments'):
            os.makedirs('/app/data/segments')
        
        # Store each mask as a file and save path in database
        for idx, mask in enumerate(masks):
            mask_array = mask['segmentation']
            mask_height, mask_width = mask_array.shape
            
            # Create unique filename for each mask
            mask_filename = f"mask_{image_id}_{idx}.npy"
            mask_path = os.path.join('/app/data/segments', mask_filename)
            
            # Save mask to file
            np.save(mask_path, mask_array)
            
            cursor.execute("""
                INSERT INTO segments (image_id, mask_path, mask_width, mask_height, confidence)
                VALUES (?, ?, ?, ?, ?)
            """, (image_id, mask_path, mask_width, mask_height, float(mask.get('stability_score', 0.0))))
        
        conn.commit()
        
        # Step 3: Clean segments (filter those with text)
        print("Cleaning segments...")
        filtered_segments = get_filtered_segments(image_id)
        
        if not filtered_segments:
            return JSONResponse({
                "image_id": image_id,
                "segments": [],
                "message": "No text segments found in the image"
            })
        
        # Step 4: Identify games for each segment
        print("Identifying games...")
        # Use the provided API key if available
        ai = AIAPI(api_key=x_openai_api_key)
        segments_data = []
        
        # Process each filtered segment to get game names
        for segment in filtered_segments:
            seg_id = segment['seg_id']
            base64_image = segment['base64_image']
            
            try:
                # Get AI analysis for the segment with retry logic for rate limits
                api_response = ai.getAPIResponse(
                    base64_image, 
                    max_retries=50,  # Retry up to 5 times
                    initial_backoff=1  # Start with 1 second backoff
                )
                
                if api_response:
                    boardGame = ai.parse_api_response(api_response).boardGame
                    game_name = boardGame.name
                else:
                    print(f"No valid response for segment {seg_id}, possibly due to insufficient balance")
                    game_name = "Unknown Game (Check OpenAI balance)"
            except Exception as e:
                print(f"Error identifying game for segment {seg_id}: {str(e)}")
                game_name = "Unknown Game"
            
            # Add to results
            segments_data.append({
                "id": seg_id,
                "confidence": segment["confidence"],
                "image": f"data:image/png;base64,{base64_image}",
                "name": game_name
            })
        
        # Step 5: Return the segment data as expected by the frontend
        return JSONResponse({
            "image_id": image_id,
            "segments": segments_data,
            "message": "Image processed successfully"
        })
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        conn.close()
