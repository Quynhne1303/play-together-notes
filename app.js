// Khởi tạo biến
let selectedIcon = null;
let gridData = [];
let deletedCells = new Set(); // Lưu các ô bị xóa
let history = [];
let redoHistory = [];
let currentRows = 4;
let currentCols = 5;

// Lấy các phần tử DOM
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const createBtn = document.getElementById('createBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearBtn = document.getElementById('clearBtn');
const grid = document.getElementById('grid');
const iconsList = document.getElementById('iconsList');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeModal = document.querySelector('.close');

// Khởi tạo
init();

function init() {
    createGrid(currentRows, currentCols);
    attachEventListeners();
    loadFromLocalStorage();
}

// Tạo bảng grid
function createGrid(rows, cols) {
    currentRows = rows;
    currentCols = cols;
    
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    // Khởi tạo dữ liệu grid nếu chưa có
    if (gridData.length === 0 || gridData.length !== rows || gridData[0].length !== cols) {
        gridData = Array(rows).fill(null).map(() => Array(cols).fill(null));
    }
    
    // Tạo các ô
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cellKey = `${i},${j}`;
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            // Nếu ô bị xóa, thêm class deleted
            if (deletedCells.has(cellKey)) {
                cell.classList.add('deleted');
            } else {
                // Nếu ô này có icon, hiển thị nó
                if (gridData[i] && gridData[i][j]) {
                    const iconData = gridData[i][j];
                    if (iconData === 'clear') {
                        cell.innerHTML = '';
                    } else {
                        const img = document.createElement('img');
                        img.src = `https://game-playtogether.vercel.app/${iconData}.png`;
                        img.alt = `Icon ${iconData}`;
                        cell.appendChild(img);
                        cell.classList.add('has-icon');
                    }
                }
                
                cell.addEventListener('click', () => handleCellClick(i, j));
            }
            
            grid.appendChild(cell);
        }
    }
}

// Xử lý click vào ô
function handleCellClick(row, col) {
    if (selectedIcon === null) {
        alert('Vui lòng chọn một biểu tượng trước!');
        return;
    }
    
    // Lưu trạng thái hiện tại vào lịch sử
    saveToHistory();
    
    // Nếu chọn X đỏ, xóa ô này khỏi bảng
    if (selectedIcon === 'clear') {
        const cellKey = `${row},${col}`;
        deletedCells.add(cellKey);
        createGrid(currentRows, currentCols);
        saveToLocalStorage();
        return;
    }
    
    // Cập nhật dữ liệu
    gridData[row][col] = selectedIcon;
    
    // Cập nhật giao diện
    const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.innerHTML = '';
    cell.classList.remove('has-icon');
    
    const img = document.createElement('img');
    img.src = `https://game-playtogether.vercel.app/${selectedIcon}.png`;
    img.alt = `Icon ${selectedIcon}`;
    cell.appendChild(img);
    cell.classList.add('has-icon');
    
    // Lưu vào localStorage
    saveToLocalStorage();
}

// Xử lý chọn icon
function selectIcon(iconData) {
    // Bỏ chọn tất cả icon
    document.querySelectorAll('.icon-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Chọn icon mới
    const iconItem = document.querySelector(`[data-icon="${iconData}"]`);
    if (iconItem) {
        iconItem.classList.add('selected');
        selectedIcon = iconData;
    }
}

// Lưu trạng thái vào lịch sử
function saveToHistory() {
    const currentState = {
        gridData: JSON.parse(JSON.stringify(gridData)),
        deletedCells: new Set(deletedCells)
    };
    history.push(currentState);
    
    // Xóa redo history khi có thay đổi mới
    redoHistory = [];
    
    // Giới hạn lịch sử 20 bước
    if (history.length > 20) {
        history.shift();
    }
}

// Hoàn tác
function undo() {
    if (history.length === 0) {
        return;
    }
    
    // Lưu trạng thái hiện tại vào redo history
    const currentState = {
        gridData: JSON.parse(JSON.stringify(gridData)),
        deletedCells: new Set(deletedCells)
    };
    redoHistory.push(currentState);
    
    const previousState = history.pop();
    gridData = previousState.gridData;
    deletedCells = previousState.deletedCells;
    createGrid(currentRows, currentCols);
    saveToLocalStorage();
}

// Làm lại
function redo() {
    if (redoHistory.length === 0) {
        return;
    }
    
    // Lưu trạng thái hiện tại vào history
    const currentState = {
        gridData: JSON.parse(JSON.stringify(gridData)),
        deletedCells: new Set(deletedCells)
    };
    history.push(currentState);
    
    const nextState = redoHistory.pop();
    gridData = nextState.gridData;
    deletedCells = nextState.deletedCells;
    createGrid(currentRows, currentCols);
    saveToLocalStorage();
}

// Xóa bảng
function clearGrid() {
    saveToHistory();
    deletedCells.clear(); // Xóa danh sách các ô bị xóa
    gridData = Array(currentRows).fill(null).map(() => Array(currentCols).fill(null));
    createGrid(currentRows, currentCols);
    saveToLocalStorage();
}

// Lưu vào localStorage
function saveToLocalStorage() {
    const data = {
        deletedCells: Array.from(deletedCells),
        gridData: gridData,
        rows: currentRows,
        cols: currentCols
    };
    localStorage.setItem('playTogetherGrid', JSON.stringify(data));
}

// Tải từ localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('playTogetherGrid');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            deletedCells = new Set(data.deletedCells || []);
            gridData = data.gridData || [];
            currentRows = data.rows || 4;
            currentCols = data.cols || 5;
            
            rowsInput.value = currentRows;
            colsInput.value = currentCols;
            
            createGrid(currentRows, currentCols);
        } catch (e) {
            console.error('Lỗi khi tải dữ liệu:', e);
        }
    }
}

// Gắn các event listener
function attachEventListeners() {
    // Nút tạo bảng
    createBtn.addEventListener('click', () => {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        
        if (rows < 1 || rows > 8 || cols < 1 || cols > 8) {
            return;
        }
        
        if (rows !== currentRows || cols !== currentCols) {
            deletedCells.clear(); // Reset các ô bị xóa khi tạo bảng mới
            saveToHistory();
            gridData = Array(rows).fill(null).map(() => Array(cols).fill(null));
            createGrid(rows, cols);
            saveToLocalStorage();
        }
    });
    
    // Nút hoàn tác
    undoBtn.addEventListener('click', undo);
    
    // Nút làm lại
    redoBtn.addEventListener('click', redo);
    
    // Nút xóa bảng
    clearBtn.addEventListener('click', clearGrid);
    
    // Chọn icon
    iconsList.addEventListener('click', (e) => {
        const iconItem = e.target.closest('.icon-item');
        if (iconItem) {
            const iconData = iconItem.dataset.icon;
            selectIcon(iconData);
        }
    });
    
    // Cho phép nhấn Enter để tạo bảng
    rowsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createBtn.click();
    });
    
    colsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createBtn.click();
    });
    
    // Nút hướng dẫn
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });
    
    // Đóng modal
    closeModal.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
    
    // Đóng modal khi click bên ngoài
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
}

// Tự động chọn icon đầu tiên
selectIcon('1');
