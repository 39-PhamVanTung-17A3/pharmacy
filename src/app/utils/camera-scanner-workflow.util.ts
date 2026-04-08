import { CameraScannerSession, createBarcodeDetector, startCameraBarcodeScanner } from './barcode-scanner.util';

export class CameraScannerWorkflow {
  private cameraStream: MediaStream | null = null;
  private cameraScannerSession: CameraScannerSession | null = null;

  static getUnavailableReason(): string | null {
    if (!window.isSecureContext) {
      return 'Trang hiện không bảo mật (HTTP). Hãy dùng HTTPS hoặc localhost để mở camera.';
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return 'Thiết bị không hỗ trợ truy cập camera';
    }

    return null;
  }

  async start(
    video: HTMLVideoElement,
    onDetected: (rawValue: string) => Promise<void> | void
  ): Promise<void> {
    this.stop(video);

    this.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });

    video.srcObject = this.cameraStream;
    video.setAttribute('playsinline', 'true');
    await video.play();

    const barcodeDetector = createBarcodeDetector();
    this.cameraScannerSession = await startCameraBarcodeScanner(video, barcodeDetector, onDetected);
  }

  stop(video?: HTMLVideoElement): void {
    if (this.cameraScannerSession) {
      this.cameraScannerSession.stop();
      this.cameraScannerSession = null;
    }

    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }

    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }
}
