import * as d3 from 'd3';
import type { GraphRenderer } from './graph-renderer.js';
import type { GraphNode } from '../types/dijkstra-types.js';
import type { SoundEffects } from '../services/sound-effects.js';
import type { UIFeedback } from '../features/ui-feedback.js';

export class GraphInteractions {
  private renderer: GraphRenderer;
  private ui: UIFeedback;
  private sounds?: SoundEffects;
  private trashElement: HTMLElement | null;

  private tempLine: d3.Selection<SVGLineElement, unknown, HTMLElement, any> | null = null;
  private sourceNode: GraphNode | null = null;
  
  private selectionBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any> | null = null;
  private startSelectionCoords: [number, number] | null = null;

  private zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private isAltPressed: boolean = false;
  
  private isRenderingFrame: boolean = false;

  constructor(renderer: GraphRenderer, ui: UIFeedback, sounds?: SoundEffects) {
    this.renderer = renderer;
    this.ui = ui;
    this.sounds = sounds;
    this.trashElement = document.getElementById('trash-zone');

    this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .filter((event) => {
        if (event.type === 'wheel') return true;
        return event.altKey || this.isAltPressed;
      })
      .on('zoom', (event) => {
        const mainGroup = this.renderer.getSvg().select('g.main-group');
        mainGroup.attr('transform', event.transform);
      });

    this.initPanZoomEvents();
    this.initCanvasEvents();
    this.initNodeEvents();
  }

  // limitar renderizado
  private requestOptimizedRender(): void {
    if (!this.isRenderingFrame) {
      this.isRenderingFrame = true;
      requestAnimationFrame(() => {
        this.renderer.render();
        this.isRenderingFrame = false;
      });
    }
  }

  private initPanZoomEvents(): void {
    const svg = this.renderer.getSvg();
    svg.call(this.zoomBehavior);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Alt') {
        e.preventDefault(); // Evita que la tecla Alt active la barra de menús del navegador
        if (!this.isAltPressed) {
          this.isAltPressed = true;
          svg.classed('cursor-grab', true);
        }
      }
    });

    const resetAltState = () => {
      this.isAltPressed = false;
      svg.classed('cursor-grab cursor-grabbing', false);
    };

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        resetAltState();
      }
    });

    window.addEventListener('blur', () => {
      resetAltState();
    });
  }

  private isOverTrash(clientX: number, clientY: number): boolean {
    if (!this.trashElement) return false;
    const rect = this.trashElement.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  private initCanvasEvents(): void {
    const svg = this.renderer.getSvg();

    svg.on('dblclick', async (event: MouseEvent) => {
      event.preventDefault();
      if (event.shiftKey || event.altKey || this.isAltPressed) return;
      const [x, y] = d3.pointer(event, svg.select('g.main-group').node());
      await this.promptAddNode(x, y);
    });

    svg.on('mousedown', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isBackground = target.tagName === 'svg' || target.classList.contains('canvas-bg');

      if (isBackground && !event.altKey && !this.isAltPressed && event.button === 0) {
        if (!event.ctrlKey && !event.metaKey) {
          this.renderer.getNodes().forEach((n) => (n.selected = false));
          this.renderer.render(); // Redibujado síncrono al iniciar clics sueltos
        }

        const coords = d3.pointer(event, svg.select('g.main-group').node());
        this.startSelectionCoords = coords;

        const mainGroup = svg.select('g.main-group');
        this.selectionBox = mainGroup
          .append('rect')
          .attr('class', 'selection-box')
          .attr('x', coords[0])
          .attr('y', coords[1])
          .attr('width', 0)
          .attr('height', 0);
      }
    });

    svg.on('mousemove', (event: MouseEvent) => {
      if (this.startSelectionCoords && this.selectionBox) {
        const [currentX, currentY] = d3.pointer(event, svg.select('g.main-group').node());
        const [startX, startY] = this.startSelectionCoords;

        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        this.selectionBox
          .attr('x', x)
          .attr('y', y)
          .attr('width', width)
          .attr('height', height);

        this.renderer.getNodes().forEach((node) => {
          node.selected =
            node.x >= x &&
            node.x <= x + width &&
            node.y >= y &&
            node.y <= y + height;
        });

        this.requestOptimizedRender();
      }
    });

    svg.on('mouseup', () => {
      if (this.selectionBox) {
        this.selectionBox.remove();
        this.selectionBox = null;
        this.startSelectionCoords = null;

        this.renderer.render();
      }
    });
  }

  private async promptRenameNode(node: GraphNode): Promise<void> {
    const inputName = await this.ui.showInput({
      title: 'Renombrar Nodo',
      subtitle: `Ingresa un nuevo nombre para "${node.id}".`,
      defaultValue: node.id,
      validate: (val) => {
        const cleanVal = val.trim();
        if (!cleanVal) return 'El identificador no puede estar vacío.';
        const upper = cleanVal.toUpperCase();
        if (upper !== node.id && this.renderer.getNodes().some((n) => n.id === upper)) {
          return `Ya existe un nodo con el nombre "${upper}".`;
        }
        return null;
      },
    });

    if (!inputName) return;

    const newId = inputName.trim().toUpperCase();
    if (newId === node.id) return;

    this.renderer.getEdges().forEach((e) => {
      if (e.from === node.id) e.from = newId;
      if (e.to === node.id) e.to = newId;
      e.id = `${e.from}-${e.to}`;
    });

    node.id = newId;
    node.label = newId;

    this.sounds?.playPop();
    this.renderer.render();
    this.ui.showToast(`Nodo renombrado a "${newId}"`, 'success');
  }

  public initNodeEvents(): void {
    const svg = this.renderer.getSvg();
    const nodeGroups = svg.selectAll<SVGGElement, GraphNode>('g.node-group');

    nodeGroups.on('.drag', null);
    nodeGroups.on('contextmenu', null);
    nodeGroups.on('click', null);

    // click derecho eliminar nodo
    nodeGroups.on('contextmenu', async (event: MouseEvent, d) => {
      event.preventDefault();
      event.stopPropagation();

      const confirmed = await this.ui.showConfirm({
        title: 'Eliminar Nodo',
        subtitle: `¿Deseas eliminar el nodo "${d.id}"?`,
      });

      if (confirmed) {
        this.renderer.removeNode(d.id);
        this.sounds?.playDelete();
        this.ui.showToast(`Nodo "${d.id}" eliminado`, 'info');
      }
    });

    // click simple seleccionar / renombrar
    nodeGroups.on('click', async (event: MouseEvent, d) => {
      event.stopPropagation();
      if (event.altKey || this.isAltPressed) return;

      if (!event.ctrlKey && !event.metaKey) {
        this.renderer.getNodes().forEach((n) => (n.selected = false));
      }

      d.selected = true;
      this.renderer.render();

      if (!event.shiftKey) {
        await this.promptRenameNode(d);
      }
    });

    const dragBehavior = d3
      .drag<SVGGElement, GraphNode>()
      .filter((event: MouseEvent) => event.button === 0 && !event.altKey && !this.isAltPressed)
      .on('start', (event, d) => {
        if (event.sourceEvent.shiftKey) {
          this.sourceNode = d;
          const mainGroup = svg.select<SVGGElement>('g.main-group');
          const edgesLayer = mainGroup.select<SVGGElement>('g.edges-layer');

          this.tempLine = edgesLayer
            .append('line')
            .attr('class', 'temp-edge-line')
            .attr('marker-end', 'url(#temp-arrowhead)')
            .attr('x1', d.x)
            .attr('y1', d.y)
            .attr('x2', d.x)
            .attr('y2', d.y);
        } else {
          if (!d.selected) {
            this.renderer.getNodes().forEach((n) => (n.selected = false));
            d.selected = true;
          }
          this.trashElement?.classList.add('trash-visible');
        }
      })
      .on('drag', (event, _) => {
        if (event.sourceEvent.shiftKey || this.tempLine) {
          if (!this.tempLine) return;
          const [x, y] = d3.pointer(event, svg.select('g.main-group').node());
          this.tempLine.attr('x2', x).attr('y2', y);
        } else {
          const dx = event.dx;
          const dy = event.dy;

          this.renderer.getNodes().forEach((n) => {
            if (n.selected) {
              n.x += dx;
              n.y += dy;
            }
          });

          this.requestOptimizedRender();

          // papelera activa
          const isHovering = this.isOverTrash(
            event.sourceEvent.clientX,
            event.sourceEvent.clientY
          );
          if (isHovering) {
            this.trashElement?.classList.add('trash-active');
          } else {
            this.trashElement?.classList.remove('trash-active');
          }
        }
      })
      .on('end', async (event, d) => {
        if (this.tempLine) {
          this.tempLine.remove();
          this.tempLine = null;

          if (this.sourceNode) {
            const mainGroupNode = svg.select('g.main-group').node();
            const [x, y] = d3.pointer(event, mainGroupNode);
            const targetNode = this.findNodeAtPosition(x, y);

            if (targetNode && targetNode.id !== this.sourceNode.id) {
              await this.promptEdgeWeight(this.sourceNode.id, targetNode.id);
            }
          }
          this.sourceNode = null;
        } else {
          this.trashElement?.classList.remove('trash-visible', 'trash-active');

          const droppedInTrash = this.isOverTrash(
            event.sourceEvent.clientX,
            event.sourceEvent.clientY
          );

          if (droppedInTrash) {
            const selected = this.renderer.getNodes().filter((n) => n.selected);
            if (selected.length > 0) {
              selected.forEach((n) => this.renderer.removeNode(n.id));
              this.sounds?.playDelete();
              this.ui.showToast(`Nodos eliminados`, 'info');
            } else {
              this.renderer.removeNode(d.id);
              this.sounds?.playDelete();
              this.ui.showToast(`Nodo "${d.id}" eliminado`, 'info');
            }
          }
          
          // Aseguramos que quede perfectamente renderizado al soltar
          this.renderer.render();
        }
      });

    nodeGroups.call(dragBehavior);
  }

  private async promptAddNode(x: number, y: number): Promise<void> {
    const nodes = this.renderer.getNodes();
    const defaultName = `N${nodes.length + 1}`;

    const inputName = await this.ui.showInput({
      title: 'Crear Nuevo Nodo',
      subtitle: 'Ingresa el nombre o identificador.',
      defaultValue: defaultName,
      validate: (val) => {
        if (!val) return 'El identificador no puede estar vacío.';
        const upper = val.toUpperCase();
        if (nodes.some((n) => n.id === upper)) return `Ya existe el nodo "${upper}".`;
        return null;
      },
    });

    if (!inputName) return;

    const name = inputName.trim().toUpperCase();
    this.renderer.addNode({ id: name, x, y, label: name, selected: false });
    this.sounds?.playPop();
    this.initNodeEvents();
  }

  private findNodeAtPosition(x: number, y: number): GraphNode | undefined {
    const radius = this.renderer.nodeRadius;
    return this.renderer.getNodes().find((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.hypot(dx, dy) <= radius;
    });
  }

  private async promptEdgeWeight(from: string, to: string): Promise<void> {
    const inputWeight = await this.ui.showInput({
      title: 'Peso de la Arista',
      subtitle: `Asigna la distancia para (${from} ➔ ${to}).`,
      defaultValue: '1',
      validate: (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) return 'Ingresa un número mayor a 0.';
        return null;
      },
    });

    if (!inputWeight) return;

    const weight = parseFloat(inputWeight);
    const edges = this.renderer.getEdges();
    const existing = edges.find((e) => e.from === from && e.to === to);

    if (existing) {
      existing.weight = weight;
    } else {
      edges.push({ id: `${from}-${to}`, from, to, weight });
    }

    this.sounds?.playPop();
    this.renderer.render();
  }

  public rebindNodeEvents(): void {
    this.initNodeEvents();
  }
}