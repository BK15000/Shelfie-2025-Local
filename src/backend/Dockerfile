# Use an NVIDIA CUDA base image with minimal components
FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu22.04

# Set noninteractive environment for apt operations
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install Python 3.10 and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    python3.10-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    gcc \
    python3-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set Python 3.10 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1

# Upgrade pip
RUN python -m pip install --no-cache-dir --upgrade pip

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install PyTorch and CUDA-compatible libraries
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cu124 \
    torch \
    torchvision

# Copy the application code
COPY . .

# Expose application port
EXPOSE 8080

# Set default command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
