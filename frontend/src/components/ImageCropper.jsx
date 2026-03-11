import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { CheckIcon, XIcon } from './Icons';

async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg', 0.85);
}

function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });
}

function ImageCropper({ image, onCropComplete, onCancel }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = useCallback((location) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((newZoom) => {
        setZoom(newZoom);
    }, []);

    const onCropAreaChange = useCallback((_, croppedAreaPixelsValue) => {
        setCroppedAreaPixels(croppedAreaPixelsValue);
    }, []);

    const handleComplete = useCallback(async () => {
        if (croppedAreaPixels) {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        }
    }, [croppedAreaPixels, image, onCropComplete]);

    return (
        <div className="cropper-container">
            <div className="cropper-area">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropAreaChange}
                />
            </div>
            <div className="cropper-controls">
                <button className="btn btn-secondary" onClick={onCancel}>
                    <XIcon /> Abbrechen
                </button>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleComplete}>
                    <CheckIcon /> Speichern
                </button>
            </div>
        </div>
    );
}

export default ImageCropper;
