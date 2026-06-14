@echo off
echo ========================================
echo    LARY AI - DEPLOY PARA RAILWAY
echo ========================================
echo.

echo PASSO 1: Crie o repositorio no GitHub
echo  - Acesse: https://github.com/new
echo  - Repository name: lary-ai
echo  - Nao inicializar com README
echo  - Clique em Create repository
echo.
pause

echo PASSO 2: Iniciar git e subir codigo
cd /d D:\PROJETOS\02_APPS\lary-ai

git init
git add .
git commit -m "v0.1.0 - MVP LARY AI pronto para Railway"
echo.
echo Agora cole o comando abaixo (substitua SEU_USUARIO):
echo.
echo git remote add origin https://github.com/SEU_USUARIO/lary-ai.git
echo git push -u origin main
echo.
pause

echo PASSO 3: Deploy no Railway
echo  - Acesse: https://railway.app
echo  - New Project -^> Deploy from GitHub
echo  - Escolha o repositorio lary-ai
echo  - Root Directory: deixar VAZIO
echo  - Clique em Deploy
echo.
pause

echo PASSO 4: Apos deploy inicial
echo  - Add Plugin -^> PostgreSQL
echo  - Add Variable -^> OPENAI_API_KEY = sk-sua-chave
echo  - Add Variable -^> JWT_SECRET = (gerar com openssl rand -base64 32)
echo.
pause

echo PASSO 5: Testar
echo  - curl https://lary-ai-backend.up.railway.app/health
echo.
pause

echo PASSO 6: Configurar frontend
echo  cd frontend
echo  echo EXPO_PUBLIC_API_URL=https://lary-ai-backend.up.railway.app ^> .env
echo  npx expo start --tunnel
echo.
pause

echo ========================================
echo    DEPLOY CONCLUIDO!
echo ========================================
pause
