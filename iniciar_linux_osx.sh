#!/bin/bash

if [ -d "node_modules" ]; then
    node .
else
    npm install
    echo "Dependências instaladas. Iniciando..."
    node .
fi
