:: this bat file is used to set git repository
:: to run use .\set_git.bat
:: add :: before the next row to initialize the repository


git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/leen7awa/web-project.git
git push -u origin main