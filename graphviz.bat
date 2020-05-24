cls
erase tasks.dot
erase tasks.svg
erase tasks.png
erase tasks.pdf
node ts_out\src\main.js tasks.txt -o tasks.dot -t template.dot
"d:\ProgsReady\graphviz-2.38\release\bin\dot.exe" -Tsvg tasks.dot -o tasks.svg
"d:\ProgsReady\graphviz-2.38\release\bin\dot.exe" -Tpdf tasks.dot -o tasks.pdf
"d:\ProgsReady\graphviz-2.38\release\bin\dot.exe" -Tpng tasks.dot -o tasks.png