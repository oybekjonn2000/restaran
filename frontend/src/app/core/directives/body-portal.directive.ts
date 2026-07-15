import { Directive, ElementRef, OnInit, OnDestroy, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[appBodyPortal]',
  standalone: true
})
export class BodyPortalDirective implements OnInit, OnDestroy {
  private originalOverflow: string | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    // Save original body overflow
    this.originalOverflow = this.document.body.style.overflow;
    
    // Append the element to the body
    this.renderer.appendChild(this.document.body, this.el.nativeElement);
    
    // Lock scroll on body
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
  }

  ngOnDestroy(): void {
    // Remove element from body
    if (this.el.nativeElement.parentNode) {
      this.renderer.removeChild(this.el.nativeElement.parentNode, this.el.nativeElement);
    }
    
    // Restore scroll on body
    if (this.originalOverflow) {
      this.renderer.setStyle(this.document.body, 'overflow', this.originalOverflow);
    } else {
      this.renderer.removeStyle(this.document.body, 'overflow');
    }
  }
}
