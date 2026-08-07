import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportCatalogPDFProps {
  catalogName: string;
  products: Array<{
    id: string;
    nome: string;
    preco: number;
    imagemUrl?: string;
    categoria?: string;
    produtor?: string;
    cor?: string;
  }>;
  validityDays?: number;
}

export function ExportCatalogPDF({ catalogName, products, validityDays = 7 }: ExportCatalogPDFProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Criar documento HTML
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${catalogName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #ff8c00;
                padding-bottom: 10px;
              }
              .header h1 {
                margin: 0;
                color: #ff8c00;
                font-size: 24px;
              }
              .header p {
                margin: 5px 0;
                font-size: 12px;
                color: #666;
              }
              .validity-info {
                background-color: #fff3e0;
                border-left: 4px solid #ff8c00;
                padding: 10px;
                margin-bottom: 20px;
                font-size: 12px;
              }
              .products-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
              }
              .product-card {
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 4px;
                page-break-inside: avoid;
              }
              .product-image {
                width: 100%;
                height: 120px;
                background-color: #f5f5f5;
                border-radius: 4px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #999;
              }
              .product-image img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              .product-name {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 4px;
                line-height: 1.3;
              }
              .product-info {
                font-size: 10px;
                color: #666;
                margin-bottom: 4px;
              }
              .product-price {
                font-size: 14px;
                font-weight: bold;
                color: #ff8c00;
                margin-top: 6px;
              }
              @media print {
                body { margin: 0; }
                .products-grid { gap: 10px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${catalogName}</h1>
              <p>Produtos disponíveis para pedido</p>
              <p>Atualizado em: ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div class="validity-info">
              <strong>Atenção:</strong> Preços válidos por ${validityDays} dias a partir da data de emissão.
              Consulte conosco para confirmar disponibilidade e preços.
            </div>

            <div class="products-grid">
              ${products.map(product => `
                <div class="product-card">
                  <div class="product-image">
                    ${product.imagemUrl ? `<img src="${product.imagemUrl}" alt="${product.nome}">` : 'Sem imagem'}
                  </div>
                  <div class="product-name">${product.nome}</div>
                  ${product.categoria ? `<div class="product-info"><strong>Categoria:</strong> ${product.categoria}</div>` : ''}
                  ${product.produtor ? `<div class="product-info"><strong>Produtor:</strong> ${product.produtor}</div>` : ''}
                  ${product.cor ? `<div class="product-info"><strong>Cor:</strong> ${product.cor}</div>` : ''}
                  <div class="product-price">R$ ${product.preco.toFixed(2)}</div>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `;

      // Abrir em nova aba para impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Aguardar carregamento e imprimir
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar catálogo para PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      disabled={isExporting || products.length === 0}
      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          <span>Gerando PDF...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span>Exportar PDF</span>
        </>
      )}
    </Button>
  );
}
