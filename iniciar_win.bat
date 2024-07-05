@echo off

if exist "node_modules" (
    node .
) else (
    npm i
    echo Dependências instaladas. Iniciando...
    node .
)
