-- Trigger: Quando um produto_loja é atualizado, sincronizar com produtos_lista vinculados
CREATE TRIGGER sync_produto_loja_to_lista_update
AFTER UPDATE ON produtos_loja
FOR EACH ROW
BEGIN
  -- Atualizar todos os produtos_lista vinculados a este produto_loja
  UPDATE produtos_lista
  SET 
    variedade = NEW.nome,
    categoriaNome = NEW.departamento,
    valorUnitario = NEW.preco,
    ativo = NEW.ativo,
    updatedAt = NOW()
  WHERE produtoLojaId = NEW.id;
END;

-- Trigger: Quando um produto_lista é atualizado e tem produtoLojaId, sincronizar com produtos_loja
CREATE TRIGGER sync_produto_lista_to_loja_update
AFTER UPDATE ON produtos_lista
FOR EACH ROW
BEGIN
  -- Se o produto_lista tem um produtoLojaId vinculado, atualizar o produto_loja
  IF NEW.produtoLojaId IS NOT NULL THEN
    UPDATE produtos_loja
    SET 
      nome = NEW.variedade,
      departamento = NEW.categoriaNome,
      preco = NEW.valorUnitario,
      ativo = NEW.ativo,
      updatedAt = NOW()
    WHERE id = NEW.produtoLojaId;
  END IF;
END;

-- Trigger: Quando um produto_loja é desativado, desativar todos os produtos_lista vinculados
CREATE TRIGGER sync_produto_loja_deactivate
AFTER UPDATE ON produtos_loja
FOR EACH ROW
BEGIN
  IF OLD.ativo = 1 AND NEW.ativo = 0 THEN
    UPDATE produtos_lista
    SET ativo = 0, updatedAt = NOW()
    WHERE produtoLojaId = NEW.id;
  END IF;
END;

-- Trigger: Quando um produto_lista é desativado, desativar o produto_loja vinculado
CREATE TRIGGER sync_produto_lista_deactivate
AFTER UPDATE ON produtos_lista
FOR EACH ROW
BEGIN
  IF OLD.ativo = 1 AND NEW.ativo = 0 AND NEW.produtoLojaId IS NOT NULL THEN
    UPDATE produtos_loja
    SET ativo = 0, updatedAt = NOW()
    WHERE id = NEW.produtoLojaId;
  END IF;
END;
