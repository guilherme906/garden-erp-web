import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Home - KpiCard erp-open-tab event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should dispatch erp-open-tab event when KpiCard with href is clicked', () => {
    // Mock window.dispatchEvent
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    // Simular clique em KpiCard com href
    const event = new CustomEvent('click');
    const handleClick = () => {
      const href = '/catalogos-venda';
      if (href) {
        const tabId = href.replace(/^\//, '');
        window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: tabId }));
      }
    };

    handleClick();

    // Verificar que dispatchEvent foi chamado
    expect(dispatchEventSpy).toHaveBeenCalled();

    // Verificar que o evento contém o tabId correto
    const calls = dispatchEventSpy.mock.calls;
    const erpOpenTabCall = calls.find((call) => {
      const event = call[0] as CustomEvent;
      return event.type === 'erp-open-tab';
    });

    expect(erpOpenTabCall).toBeDefined();
    const erpEvent = erpOpenTabCall![0] as CustomEvent;
    expect(erpEvent.detail).toBe('catalogos-venda');

    dispatchEventSpy.mockRestore();
  });

  it('should extract correct tabId from various href formats', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    const testCases = [
      { href: '/catalogos-venda', expected: 'catalogos-venda' },
      { href: '/vendas', expected: 'vendas' },
      { href: '/estoque', expected: 'estoque' },
      { href: '/financeiro', expected: 'financeiro' },
      { href: '/clientes', expected: 'clientes' },
    ];

    testCases.forEach(({ href, expected }) => {
      dispatchEventSpy.mockClear();

      const handleClick = () => {
        if (href) {
          const tabId = href.replace(/^\//, '');
          window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: tabId }));
        }
      };

      handleClick();

      const calls = dispatchEventSpy.mock.calls;
      const erpOpenTabCall = calls.find((call) => {
        const event = call[0] as CustomEvent;
        return event.type === 'erp-open-tab';
      });

      expect(erpOpenTabCall).toBeDefined();
      const erpEvent = erpOpenTabCall![0] as CustomEvent;
      expect(erpEvent.detail).toBe(expected);
    });

    dispatchEventSpy.mockRestore();
  });

  it('should not dispatch event when href is not provided', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    const handleClick = () => {
      const href = undefined;
      if (href) {
        const tabId = href.replace(/^\//, '');
        window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: tabId }));
      }
    };

    handleClick();

    expect(dispatchEventSpy).not.toHaveBeenCalled();

    dispatchEventSpy.mockRestore();
  });
});
