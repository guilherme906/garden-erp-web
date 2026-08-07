'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ProdutoPreco {
  nome: string;
  quantidade: number;
  custoPorUnidade: number;
  pacote: number;
  frete: number;
  icms: number;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

export default function TabelaPreco() {
  const [divisorVarejo, setDivisorVarejo] = useState(0.35);
  const [divisorInter, setDivisorInter] = useState(0.45);
  const [divisorAtacado, setDivisorAtacado] = useState(0.58);
  const [produtos, setProdutos] = useState<ProdutoPreco[]>([]);
  const [abaAtiva, setAbaAtiva] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files;
    if (!arquivos) return;

    let produtosAcumulados: { [key: string]: ProdutoPreco } = {};
    let arquivosLidos = 0;

    for (let i = 0; i < arquivos.length; i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const conteudo = event.target?.result as string;
        const linhas = conteudo.split('\n').filter(l => l.trim());

        for (let j = 1; j < linhas.length; j++) {
          const valores = linhas[j].split(';');
          if (valores.length < 9) continue;

          const descricao = valores[4]?.trim() || 'Produto';
          const qtEmb = parseInt(valores[5]?.trim() || '1');
          const qtPorEmb = parseInt(valores[6]?.trim() || '1');
          const custoPorUnidade = parseFloat(valores[7]?.trim().replace(',', '.') || '0');
          
          const quantidade = qtEmb * qtPorEmb;

          if (produtosAcumulados[descricao]) {
            const prev = produtosAcumulados[descricao];
            const totalQtd = prev.quantidade + quantidade;
            prev.custoPorUnidade = (prev.custoPorUnidade * prev.quantidade + custoPorUnidade * quantidade) / totalQtd;
            prev.quantidade = totalQtd;
          } else {
            produtosAcumulados[descricao] = {
              nome: descricao,
              quantidade,
              custoPorUnidade,
              pacote: qtEmb,
              frete: 0,
              icms: 0,
            };
          }
        }

        arquivosLidos++;
        if (arquivosLidos === arquivos.length) {
          setProdutos(Object.values(produtosAcumulados));
          toast.success(`${arquivos.length} arquivo(s) processado(s) com sucesso!`);
        }
      };
      reader.readAsText(arquivos[i]);
    }
  };

  const carregarExemplo = () => {
    const exemploTexto = `DT_VENDA;NOME_PRODUTOR;CHAVE;COD_PROD;DESCRICAO_PRODUTO;QT_EMB;QT_POR_EMB;PRECO;VLR_TOTAL;
27/05/2026;EDIMAR PEREIRA DA SILVA;5191;03904;ROSA SAMOURAI 050 CM ESTUFA;4;100;4.11;1644.00;
27/05/2026;JOHANNES SCHELTINGA;5191;03904;ROSA SAMOURAI 050 CM ESTUFA;2;100;4.21;842.00;
27/05/2026;CHRISTINE VAN DER VEN;5191;01645;PALMEIRA CHAMAEDOREA ELEGANS P11;4;12;5.44;261.12;`;
    
    const linhas = exemploTexto.split('\n').filter(l => l.trim());
    let produtosAcumulados: { [key: string]: ProdutoPreco } = {};

    for (let j = 1; j < linhas.length; j++) {
      const valores = linhas[j].split(';');
      if (valores.length < 9) continue;

      const descricao = valores[4]?.trim() || 'Produto';
      const qtEmb = parseInt(valores[5]?.trim() || '1');
      const qtPorEmb = parseInt(valores[6]?.trim() || '1');
      const custoPorUnidade = parseFloat(valores[7]?.trim().replace(',', '.') || '0');
      
      const quantidade = qtEmb * qtPorEmb;

      if (produtosAcumulados[descricao]) {
        const prev = produtosAcumulados[descricao];
        const totalQtd = prev.quantidade + quantidade;
        prev.custoPorUnidade = (prev.custoPorUnidade * prev.quantidade + custoPorUnidade * quantidade) / totalQtd;
        prev.quantidade = totalQtd;
      } else {
        produtosAcumulados[descricao] = {
          nome: descricao,
          quantidade,
          custoPorUnidade,
          pacote: qtEmb,
          frete: 0,
          icms: 0,
        };
      }
    }

    setProdutos(Object.values(produtosAcumulados));
    toast.success('Lista de demonstração carregada com sucesso!');
  };

  const calcularCustoTotal = (p: ProdutoPreco) => {
    return (p.custoPorUnidade + p.frete) * (1 + p.icms / 100);
  };

  const calcularPrecos = (p: ProdutoPreco) => {
    const custoTotal = calcularCustoTotal(p);
    return {
      custoTotal,
      varejo: custoTotal / divisorVarejo,
      inter: custoTotal / divisorInter,
      atacado: custoTotal / divisorAtacado,
    };
  };

  const custoAcumulado = produtos.reduce((acc, p) => acc + calcularCustoTotal(p) * p.pacote, 0);
  const fatVarejo = produtos.reduce((acc, p) => {
    const precos = calcularPrecos(p);
    return acc + precos.varejo * p.pacote;
  }, 0);
  const fatInter = produtos.reduce((acc, p) => {
    const precos = calcularPrecos(p);
    return acc + precos.inter * p.pacote;
  }, 0);
  const fatAtacado = produtos.reduce((acc, p) => {
    const precos = calcularPrecos(p);
    return acc + precos.atacado * p.pacote;
  }, 0);

  const lucroVarejo = fatVarejo - custoAcumulado;
  const lucroInter = fatInter - custoAcumulado;
  const lucroAtacado = fatAtacado - custoAcumulado;

  const exportarPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Cabeçalho
    doc.setFontSize(14);
    doc.text('Gerenciador de Margens e Precificação', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Sistema de Precificação - Flores e Plantas`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setDrawColor(255, 165, 0);
    doc.setLineWidth(1);
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 5;

    // Tabela de produtos
    const tableData = produtos.map((p) => {
      const precos = calcularPrecos(p);
      return [
        p.nome,
        p.quantidade.toString(),
        p.pacote.toString(),
        `R$ ${precos.custoTotal.toFixed(2)}`,
        `R$ ${precos.varejo.toFixed(2)}`,
        `R$ ${precos.inter.toFixed(2)}`,
        `R$ ${precos.atacado.toFixed(2)}`,
      ];
    });

    doc.autoTable({
      head: [['PRODUTO', 'QUANTIDADE TOTAL', 'PAGOTE', 'CUSTO TOTAL/PC', 'VVMACJO PC', 'VICD UM PC', 'VICD ATA PC']],
      body: tableData,
      startY: yPosition,
      margin: { left: 10, right: 10 },
      headStyles: {
        fillColor: [255, 165, 0],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
      },
    });

    // Verifica se precisa de nova página
    if ((doc as any).lastAutoTable?.finalY > pageHeight - 60) {
      doc.addPage();
      yPosition = 15;
    } else {
      yPosition = ((doc as any).lastAutoTable?.finalY || 15) + 15;
    }

    // Resumo Financeiro
    doc.setFontSize(12);
    doc.text('Estimativa de Faturamento e Lucro Sobre o Pedido Consolidado', 10, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.text(`Custo Total Acumulado Unificado: R$ ${custoAcumulado.toFixed(2)}`, 10, yPosition);
    yPosition += 15;

    // Caixas de cenários
    const boxWidth = (pageWidth - 30) / 3;
    const boxHeight = 40;
    const boxY = yPosition;

    // Varejo
    doc.setDrawColor(0, 0, 255);
    doc.rect(10, boxY, boxWidth, boxHeight);
    doc.setFontSize(10);
    doc.text('SE VENDER 100% NO VAREJO', 10 + 2, boxY + 6, { maxWidth: boxWidth - 4 });
    doc.setFontSize(11);
    doc.text(`Faturamento Total: R$ ${fatVarejo.toFixed(2)}`, 10 + 2, boxY + 16);
    doc.setFontSize(10);
    doc.text(`Lucro Estimado: R$ ${lucroVarejo.toFixed(2)}`, 10 + 2, boxY + 26);

    // Intermediário
    doc.setDrawColor(128, 128, 128);
    doc.rect(10 + boxWidth + 5, boxY, boxWidth, boxHeight);
    doc.setFontSize(10);
    doc.text('SE VENDER 100% NO INTERMEDIÁRIO', 10 + boxWidth + 7, boxY + 6, { maxWidth: boxWidth - 4 });
    doc.setFontSize(11);
    doc.text(`Faturamento Total: R$ ${fatInter.toFixed(2)}`, 10 + boxWidth + 7, boxY + 16);
    doc.setFontSize(10);
    doc.text(`Lucro Estimado: R$ ${lucroInter.toFixed(2)}`, 10 + boxWidth + 7, boxY + 26);

    // Atacado
    doc.setDrawColor(255, 165, 0);
    doc.rect(10 + (boxWidth + 5) * 2, boxY, boxWidth, boxHeight);
    doc.setFontSize(10);
    doc.text('SE VENDER 100% NO ATACADO', 10 + (boxWidth + 5) * 2 + 2, boxY + 6, { maxWidth: boxWidth - 4 });
    doc.setFontSize(11);
    doc.text(`Faturamento Total: R$ ${fatAtacado.toFixed(2)}`, 10 + (boxWidth + 5) * 2 + 2, boxY + 16);
    doc.setFontSize(10);
    doc.text(`Lucro Estimado: R$ ${lucroAtacado.toFixed(2)}`, 10 + (boxWidth + 5) * 2 + 2, boxY + 26);

    // Rodapé
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    doc.save(`precificacao_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  const exportarTxt = () => {
    let txt = 'PRECIFICAÇÃO - RELATÓRIO\n';
    txt += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    txt += `Divisor Varejo: ${divisorVarejo}\n`;
    txt += `Divisor Intermediário: ${divisorInter}\n`;
    txt += `Divisor Atacado: ${divisorAtacado}\n\n`;

    txt += 'PRODUTOS:\n';
    txt += '─'.repeat(100) + '\n';
    produtos.forEach((p) => {
      const precos = calcularPrecos(p);
      txt += `${p.nome}\n`;
      txt += `  Quantidade: ${p.quantidade} | Pacote: ${p.pacote}\n`;
      txt += `  Custo Unitário: R$ ${p.custoPorUnidade.toFixed(2)} | Frete: R$ ${p.frete.toFixed(2)} | ICMS: ${p.icms}%\n`;
      txt += `  Custo Total: R$ ${precos.custoTotal.toFixed(2)}\n`;
      txt += `  Varejo: R$ ${precos.varejo.toFixed(2)} | Intermediário: R$ ${precos.inter.toFixed(2)} | Atacado: R$ ${precos.atacado.toFixed(2)}\n`;
      txt += '─'.repeat(100) + '\n';
    });

    txt += '\nRESUMO FINANCEIRO:\n';
    txt += `Custo Total Acumulado: R$ ${custoAcumulado.toFixed(2)}\n`;
    txt += `Faturamento Varejo: R$ ${fatVarejo.toFixed(2)} | Lucro: R$ ${lucroVarejo.toFixed(2)}\n`;
    txt += `Faturamento Intermediário: R$ ${fatInter.toFixed(2)} | Lucro: R$ ${lucroInter.toFixed(2)}\n`;
    txt += `Faturamento Atacado: R$ ${fatAtacado.toFixed(2)} | Lucro: R$ ${lucroAtacado.toFixed(2)}\n`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt));
    element.setAttribute('download', `precificacao_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Arquivo TXT exportado com sucesso!');
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciador de Margens e Precificação</h1>
        {produtos.length > 0 && (
          <div className="flex gap-3">
            <Button onClick={exportarTxt} className="bg-green-600 hover:bg-green-700">
              💾 Salvar Lote Unificado (.txt)
            </Button>
            <Button onClick={exportarPDF} className="bg-red-600 hover:bg-red-700">
              📄 Salvar em PDF
            </Button>
          </div>
        )}
      </div>

      {/* Configuração */}
      <div className="bg-yellow-50 border border-yellow-400 rounded p-4 mb-6 flex gap-6 flex-wrap">
        <div>
          <label className="text-xs font-bold text-yellow-800 block mb-2">DIVISOR VAREJO (V/VAREJO)</label>
          <Input
            type="number"
            step="0.01"
            value={divisorVarejo}
            onChange={(e) => setDivisorVarejo(parseFloat(e.target.value))}
            className="w-24"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-yellow-800 block mb-2">DIVISOR INTERMED. (V/CD UM)</label>
          <Input
            type="number"
            step="0.01"
            value={divisorInter}
            onChange={(e) => setDivisorInter(parseFloat(e.target.value))}
            className="w-24"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-yellow-800 block mb-2">DIVISOR ATACADO (V/CD ATA)</label>
          <Input
            type="number"
            step="0.01"
            value={divisorAtacado}
            onChange={(e) => setDivisorAtacado(parseFloat(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      {/* Upload */}
      <div className="flex gap-4 mb-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition"
        >
          <div className="text-4xl mb-2">📁</div>
          <p className="text-gray-700 font-semibold">Clique para selecionar arquivos TXT</p>
          <p className="text-gray-500 text-sm">ou arraste arquivos aqui</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        <Button onClick={carregarExemplo} className="bg-blue-600 hover:bg-blue-700 h-full">
          📋 Carregar Exemplo
        </Button>
      </div>

      {/* Abas */}
      {produtos.length > 0 && (
        <div>
          <div className="flex gap-4 mb-4 border-b">
            <button
              onClick={() => setAbaAtiva(0)}
              className={`px-4 py-2 font-semibold ${abaAtiva === 0 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              📊 Precificação (Maço Unitário)
            </button>
            <button
              onClick={() => setAbaAtiva(1)}
              className={`px-4 py-2 font-semibold ${abaAtiva === 1 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              📈 Simulação de Lote Total
            </button>
            <button
              onClick={() => setAbaAtiva(2)}
              className={`px-4 py-2 font-semibold ${abaAtiva === 2 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              💰 Resumo Financeiro
            </button>
          </div>

          {/* Aba 1: Precificação */}
          {abaAtiva === 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-yellow-300">
                    <th className="border p-2 text-left">PRODUTO</th>
                    <th className="border p-2 text-center">QUANTIDADE TOTAL</th>
                    <th className="border p-2 text-center">PAGOTE</th>
                    <th className="border p-2 text-right">CUSTO TOTAL/PC</th>
                    <th className="border p-2 text-right">VVMACJO PC</th>
                    <th className="border p-2 text-right">VICD UM PC</th>
                    <th className="border p-2 text-right">VICD ATA PC</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p, i) => {
                    const precos = calcularPrecos(p);
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border p-2">{p.nome}</td>
                        <td className="border p-2 text-center">{p.quantidade}</td>
                        <td className="border p-2 text-center">{p.pacote}</td>
                        <td className="border p-2 text-right">R$ {precos.custoTotal.toFixed(2)}</td>
                        <td className="border p-2 text-right">R$ {precos.varejo.toFixed(2)}</td>
                        <td className="border p-2 text-right">R$ {precos.inter.toFixed(2)}</td>
                        <td className="border p-2 text-right">R$ {precos.atacado.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Aba 2: Simulação */}
          {abaAtiva === 1 && (
            <div className="bg-gray-50 p-6 rounded">
              <h3 className="text-lg font-bold mb-4">Simulação de Lote Total</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <h4 className="font-bold text-blue-700 mb-2">SE VENDER 100% NO VAREJO</h4>
                  <p className="text-sm text-gray-600">Faturamento Total:</p>
                  <p className="text-2xl font-bold text-blue-700">R$ {fatVarejo.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-2">Lucro Estimado:</p>
                  <p className="text-2xl font-bold text-green-600">R$ {lucroVarejo.toFixed(2)}</p>
                </div>
                <div className="bg-gray-100 border-l-4 border-gray-500 p-4">
                  <h4 className="font-bold text-gray-700 mb-2">SE VENDER 100% NO INTERMEDIÁRIO</h4>
                  <p className="text-sm text-gray-600">Faturamento Total:</p>
                  <p className="text-2xl font-bold text-gray-700">R$ {fatInter.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-2">Lucro Estimado:</p>
                  <p className="text-2xl font-bold text-green-600">R$ {lucroInter.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                  <h4 className="font-bold text-orange-700 mb-2">SE VENDER 100% NO ATACADO</h4>
                  <p className="text-sm text-gray-600">Faturamento Total:</p>
                  <p className="text-2xl font-bold text-orange-700">R$ {fatAtacado.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-2">Lucro Estimado:</p>
                  <p className="text-2xl font-bold text-green-600">R$ {lucroAtacado.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Aba 3: Resumo */}
          {abaAtiva === 2 && (
            <div className="bg-gray-50 p-6 rounded">
              <h3 className="text-lg font-bold mb-4">Resumo Financeiro</h3>
              <div className="space-y-3">
                <p className="text-lg"><strong>Custo Total Acumulado Unificado:</strong> R$ {custoAcumulado.toFixed(2)}</p>
                <p className="text-lg"><strong>Faturamento Varejo:</strong> R$ {fatVarejo.toFixed(2)}</p>
                <p className="text-lg"><strong>Lucro Varejo:</strong> R$ {lucroVarejo.toFixed(2)}</p>
                <p className="text-lg"><strong>Faturamento Intermediário:</strong> R$ {fatInter.toFixed(2)}</p>
                <p className="text-lg"><strong>Lucro Intermediário:</strong> R$ {lucroInter.toFixed(2)}</p>
                <p className="text-lg"><strong>Faturamento Atacado:</strong> R$ {fatAtacado.toFixed(2)}</p>
                <p className="text-lg"><strong>Lucro Atacado:</strong> R$ {lucroAtacado.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
