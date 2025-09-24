import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneMath from 'cornerstone-math';
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
@Component({
  selector: 'app-visor-cornerstone',
  templateUrl: './visor-cornerstone.component.html',
  styleUrls: ['./visor-cornerstone.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class VisorCornerstoneComponent implements AfterViewInit, OnDestroy {
  @Input() imagenUrl: string = '';
  @Input() vista: string = '';
  @Output() cerrar = new EventEmitter<{ vista: string, dataUrl: string }>();
  @Output() actualizar = new EventEmitter<{ vista: string, dataUrl: string }>();
  @ViewChild('cornerstoneElement') cornerstoneElementRef!: ElementRef;
  private element!: HTMLDivElement;
  private originalViewport: any;
  showSlider: boolean = false;
  contrastValue: number = 1;
  showZoomSlider: boolean = false;
  zoomValue: number = 1;
  originalScale: number = 1;
  originalWindowWidth: number = 0;
  originalWindowCenter: number = 0;
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.element = this.cornerstoneElementRef.nativeElement;
      this.element.style.overflow = 'auto';
      cornerstoneTools.external.cornerstone = cornerstone;
      cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
      cornerstoneWebImageLoader.external.cornerstone = cornerstone;
      cornerstoneWebImageLoader.configure({
        beforeSend: function (xhr: XMLHttpRequest) {
          xhr.setRequestHeader('Accept', 'image/*');
        }
      });
      cornerstone.registerImageLoader('http', cornerstoneWebImageLoader.loadImage);
      cornerstone.registerImageLoader('https', cornerstoneWebImageLoader.loadImage);
      cornerstone.registerImageLoader('data', cornerstoneWebImageLoader.loadImage);
      try {
        cornerstone.enable(this.element);
      } catch (e) {
      }
      const imageId = this.imagenUrl;
      const isEnabled = cornerstone.getEnabledElements().some(
        (enabled: { element: HTMLElement }) => enabled.element === this.element
      );
      if (!isEnabled) {
        return;
      }
      cornerstone.loadAndCacheImage(imageId).then((image: any) => {
        cornerstone.displayImage(this.element, image);
        const viewport = cornerstone.getDefaultViewportForImage(this.element, image);
        this.originalViewport = { ...viewport };
        this.originalWindowWidth = viewport.voi.windowWidth;
        this.originalWindowCenter = viewport.voi.windowCenter;
        cornerstone.setViewport(this.element, viewport);
        this.originalScale = viewport.scale;
        if (!cornerstoneTools.getToolForElement(this.element, 'Zoom')) {
          cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        }
        if (!cornerstoneTools.getToolForElement(this.element, 'Invert')) {
          cornerstoneTools.addTool(cornerstoneTools.InvertTool);
        }
        if (!cornerstoneTools.getToolForElement(this.element, 'Magnify')) {
          cornerstoneTools.addTool(cornerstoneTools.MagnifyTool);
        }
        if (!cornerstoneTools.getToolForElement(this.element, 'Pan')) {
          cornerstoneTools.addTool(cornerstoneTools.PanTool);
        }
        cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 });
        cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });
      }).catch((err: unknown) => {
      });
    }, 0);
  }
  aplicarInvertido(): void {
    const viewport = cornerstone.getViewport(this.element);
    viewport.invert = !viewport.invert;
    cornerstone.setViewport(this.element, viewport);
    this.showSlider = false;
    this.showZoomSlider = false;
  }
  activarLupa(): void {
    this.showZoomSlider = !this.showZoomSlider;
    if (this.showZoomSlider) {
      this.showSlider = false;
    }
  }
  activarZoom(): void {
    cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 });
    cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });
  }
  activarContraste(): void {
    this.showSlider = !this.showSlider;
    if (this.showSlider) {
      this.showZoomSlider = false;
    }
  }
  ajustarContraste(valor: number): void {
    const viewport = cornerstone.getViewport(this.element);
    if (valor === 1) {
      viewport.voi.windowWidth = this.originalWindowWidth;
      viewport.voi.windowCenter = this.originalWindowCenter;
    } else {
      viewport.voi.windowWidth = this.originalWindowWidth / valor;
      viewport.voi.windowCenter = this.originalWindowCenter;
    }
    cornerstone.setViewport(this.element, viewport);
  }
  onSliderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.contrastValue = value;
    this.ajustarContraste(value);
  }
  onZoomSliderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.zoomValue = value;
    this.ajustarZoom(value);
  }
  ajustarZoom(valor: number): void {
    const viewport = cornerstone.getViewport(this.element);
    viewport.scale = this.originalScale * valor;
    cornerstone.setViewport(this.element, viewport);
  }
  cerrarVisor(): void {
    if (this.element) {
      try {
        const canvas = this.element.querySelector('canvas') as HTMLCanvasElement | null;
        const dataUrl = canvas?.toDataURL('image/jpeg') || '';
        this.actualizar.emit({ vista: this.vista, dataUrl });
        this.cerrar.emit({ vista: this.vista, dataUrl });
      } catch (err) {
      }
    }
  }
  ngOnDestroy(): void {
    if (this.element) {
      try {
        try {
          cornerstoneTools.setToolDisabled('Magnify', {});
        } catch (e) {
        }
        try {
          cornerstoneTools.setToolDisabled('Zoom', {});
        } catch (e) {
        }
        try {
          cornerstoneTools.setToolDisabled('Pan', {});
        } catch (e) {
        }
        const enabledElements = cornerstone.getEnabledElements();
        const isEnabled = enabledElements.some(
          (enabled: { element: HTMLElement }) => enabled.element === this.element
        );
        if (isEnabled) {
          try {
            cornerstone.disable(this.element);
          } catch (err) {
          }
        } else {
          console.info('Elemento ya no está registrado como habilitado por cornerstone.');
        }
      } catch (err) {
      }
    }
  }
}
