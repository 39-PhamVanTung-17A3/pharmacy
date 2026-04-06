type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export type CameraScannerSession = {
  stop: () => void;
};

export function createBarcodeDetector(): BarcodeDetectorLike | null {
  const detectorGlobal = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
  if (!detectorGlobal.BarcodeDetector) {
    return null;
  }

  return new detectorGlobal.BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
  });
}

export async function startCameraBarcodeScanner(
  video: HTMLVideoElement,
  detector: BarcodeDetectorLike | null,
  onDetected: (rawValue: string) => Promise<void> | void
): Promise<CameraScannerSession> {
  let stopped = false;
  let scanTimer: number | null = null;
  let zxingControls: { stop: () => void } | null = null;
  let cameraScanBusy = false;
  let cameraSubmitBusy = false;

  const handleDetectedCode = async (rawValue: string): Promise<void> => {
    if (!rawValue || cameraSubmitBusy || stopped) {
      return;
    }

    cameraSubmitBusy = true;
    try {
      await onDetected(rawValue.trim());
    } finally {
      cameraSubmitBusy = false;
    }
  };

  if (detector) {
    scanTimer = window.setInterval(() => {
      void (async () => {
        if (stopped || cameraScanBusy || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
          return;
        }

        cameraScanBusy = true;
        try {
          const results = await detector.detect(video);
          const rawValue = results.find((item) => !!item.rawValue)?.rawValue?.trim();
          if (!rawValue) {
            return;
          }

          await handleDetectedCode(rawValue);
        } catch (error) {
          console.error('Detect barcode from camera failed', error);
        } finally {
          cameraScanBusy = false;
        }
      })();
    }, 350);
  } else {
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const reader = new BrowserMultiFormatReader();
    zxingControls = await reader.decodeFromVideoElement(video, (result) => {
      const rawValue = result?.getText?.()?.trim();
      if (!rawValue) {
        return;
      }
      void handleDetectedCode(rawValue);
    });
  }

  return {
    stop: () => {
      stopped = true;
      if (scanTimer !== null) {
        window.clearInterval(scanTimer);
        scanTimer = null;
      }
      if (zxingControls) {
        zxingControls.stop();
        zxingControls = null;
      }
    }
  };
}

export function getCameraAccessErrorMessage(error: unknown): string {
  const errorName = error instanceof DOMException ? error.name : '';
  if (errorName === 'NotAllowedError') {
    return 'Bạn đã chặn quyền camera. Hãy cấp quyền camera trong trình duyệt.';
  }
  if (errorName === 'NotFoundError') {
    return 'Không tìm thấy camera trên thiết bị.';
  }
  if (errorName === 'NotReadableError') {
    return 'Camera đang được ứng dụng khác sử dụng.';
  }
  return 'Không thể truy cập camera. Vui lòng cấp quyền camera.';
}
