/*
  Otaknya itung-itungan matematika.
*/

const MathCore = (function() {
    'use strict';

    // Karakter yang boleh dipake di persamaan
    const ALLOWED_CHARS = /^[0-9x+\-*/().,\s^sincotanqrlge]+$/i;
    
    // Fungsi matematika yang aman
    const ALLOWED_FUNCTIONS = ['sin', 'cos', 'tan', 'sqrt', 'log', 'abs'];

    // Bersihin input pengguna, biar aman.
    function sanitizeEquation(equation) {
        if (!equation || typeof equation !== 'string') {
            return 'x^2'; // Kalo inputnya ngaco, pake ini aja.
        }

        // Buang spasi-spasi iseng.
        equation = equation.trim().replace(/\s+/g, '');

        // Cek, ada karakter aneh nggak?
        if (!ALLOWED_CHARS.test(equation)) {
            throw new Error('Karakter tidak valid! Hanya gunakan: 0-9, x, +, -, *, /, ^, (, ), sin, cos, tan');
        }

        // Ganti '^' jadi '**' biar JS ngerti.
        equation = equation.replace(/\^/g, '**');

        // Tambahin 'Math.' biar fungsinya jalan.
        equation = equation.replace(/sin\(/gi, 'Math.sin(');
        equation = equation.replace(/cos\(/gi, 'Math.cos(');
        equation = equation.replace(/tan\(/gi, 'Math.tan(');
        equation = equation.replace(/sqrt\(/gi, 'Math.sqrt(');
        equation = equation.replace(/log\(/gi, 'Math.log(');
        equation = equation.replace(/abs\(/gi, 'Math.abs(');

        // Jaga-jaga dari kode jahil.
        const dangerousPatterns = ['eval', 'Function', 'constructor', 'prototype', '__proto__'];
        for (let pattern of dangerousPatterns) {
            if (equation.toLowerCase().includes(pattern.toLowerCase())) {
                throw new Error('Pola berbahaya terdeteksi!');
            }
        }

        return equation;
    }

    // Ngitung nilai y kalo x-nya dikasih tau.
    function evaluateEquation(equation, x) {
        try {
            // Bersihin dulu persamaannya.
            const sanitized = sanitizeEquation(equation);
            
            // Ganti 'x' dengan angkanya.
            const replaced = sanitized.replace(/x/g, `(${x})`);
            
            // Cara aman eksekusi string, bukan pake eval().
            const result = new Function('return ' + replaced)();
            
            // Hasilnya harus angka, bukan yang lain.
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Hasil tidak valid');
            }
            
            return result;
        } catch (error) {
            throw new Error(`Error evaluasi di x=${x}: ${error.message}`);
        }
    }

    // Bikin data titik-titik (x,y) buat digambar.
    function generateDataPoints(equation, minX = -10, maxX = 10, step = 0.1) {
        const xValues = [];
        const yValues = [];
        const errors = [];

        // Batasi rentang biar komputernya nggak nangis.
        minX = Math.max(minX, -100);
        maxX = Math.min(maxX, 100);

        for (let x = minX; x <= maxX; x += step) {
            try {
                // Bunderin x biar angkanya rapi.
                const xRounded = Math.round(x * 10) / 10;
                const y = evaluateEquation(equation, xRounded);
                
                // Kalo nilainya ketinggian, skip aja, ntar grafiknya rusak.
                if (Math.abs(y) < 1000000) {
                    xValues.push(xRounded);
                    yValues.push(y);
                }
            } catch (error) {
                errors.push({ x: x, error: error.message });
            }
        }

        // Kalo dari awal zonk, yaudah lapor eror.
        if (errors.length > 0 && xValues.length === 0) {
            throw new Error('Tidak dapat mengevaluasi persamaan untuk rentang x yang diberikan');
        }

        return { xValues, yValues, errors };
    }

    // Refleksi sumbu X: f(x) -> -f(x)
    function reflectX(equation) {
        equation = equation.trim();
        
        // Kalo udah minus, jadiin plus.
        if (equation.startsWith('-')) {
            return equation.substring(1);
        }
        
        // Kalo belum, tambahin minus.
        return '-(' + equation + ')';
    }

    // Dilatasi 2x: f(x) -> f(2*x)
    function dilate2x(equation) {
        equation = equation.trim();
        
        // Ganti 'x' jadi '(2*x)'.
        return equation.replace(/x/g, '(2*x)');
    }

    // Dilatasi 1/2x: f(x) -> f(0.5*x)
    function dilateHalfX(equation) {
        equation = equation.trim();
        
        // Ganti 'x' jadi '(0.5*x)'.
        return equation.replace(/x/g, '(0.5*x)');
    }

    // Geser Kanan: f(x) -> f(x-1)
    function shiftRight(equation) {
        equation = equation.trim();
        
        // Ganti 'x' jadi '(x-1)'.
        return equation.replace(/x/g, '(x-1)');
    }

    // Refleksi sumbu Y: f(x) -> f(-x)
    function reflectY(equation) {
        equation = equation.trim();
        
        // Ganti 'x' jadi '(-x)'.
        return equation.replace(/x/g, '(-x)');
    }

    // Geser Kiri: f(x) -> f(x+1)
    function shiftLeft(equation) {
        equation = equation.trim();
        
        // Ganti 'x' jadi '(x+1)'.
        return equation.replace(/x/g, '(x+1)');
    }

    // Transformasi lengkap: a*f(x-h)+k
    function applyTransformation(equation, a, h, k) {
        // Urus pergeseran horizontal (h).
        let h_str = h > 0 ? `(x-${h})` : `(x+${-h})`;
        if (h === 0) h_str = 'x';
        let transformedEq = equation.replace(/x/g, h_str);

        // Urus skala vertikal (a).
        transformedEq = `(${a}) * (${transformedEq})`;

        // Urus pergeseran vertikal (k).
        transformedEq = `${transformedEq} + (${k})`;

        return transformedEq;
    }

    // Ngecek validasi persamaan.
    function validateEquation(equation) {
        if (!equation || equation.trim() === '') {
            return { valid: true, message: '' }; // Kosong berarti aman.
        }

        // Cek ada karakter terlarang nggak.
        const cleanEq = equation.replace(/\s+/g, '');
        if (!ALLOWED_CHARS.test(cleanEq)) {
            return { 
                valid: false, 
                message: '❌ Karakter tidak valid! Gunakan hanya: 0-9, x, +, -, *, /, ^, (, ), sin, cos, tan' 
            };
        }

        // Kurungnya harus sepasang.
        let openParens = 0;
        for (let char of equation) {
            if (char === '(') openParens++;
            if (char === ')') openParens--;
            if (openParens < 0) {
                return { valid: false, message: '❌ Kurung tutup berlebih!' };
            }
        }
        if (openParens !== 0) {
            return { valid: false, message: '❌ Kurung tidak seimbang!' };
        }

        // Tes itung di x=0, kalo eror berarti sintaks salah.
        try {
            evaluateEquation(equation, 0);
            return { valid: true, message: '✅ Persamaan valid!' };
        } catch (error) {
            return { 
                valid: false, 
                message: `❌ Error: ${error.message}` 
            };
        }
    }

    // Bikin deskripsi teks dari grafik (buat aksesibilitas).
    function analyzeEquation(equation) {
        try {
            const data = generateDataPoints(equation);
            const { xValues, yValues } = data;

            if (xValues.length === 0) {
                return 'Grafik tidak dapat dianalisis karena tidak ada data valid.';
            }

            // Cari titik paling tinggi & rendah.
            let maxY = Math.max(...yValues);
            let minY = Math.min(...yValues);
            let maxYIndex = yValues.indexOf(maxY);
            let minYIndex = yValues.indexOf(minY);
            
            let maxX = xValues[maxYIndex];
            let minX = xValues[minYIndex];

            // Cari titik potong sumbu X.
            let xIntercepts = [];
            for (let i = 0; i < yValues.length; i++) {
                if (Math.abs(yValues[i]) < 0.1) {
                    xIntercepts.push(xValues[i].toFixed(1));
                }
            }

            // Cari titik potong sumbu Y.
            let yIntercept = null;
            try {
                yIntercept = evaluateEquation(equation, 0).toFixed(2);
            } catch (e) {
                yIntercept = 'tidak terdefinisi';
            }

            // Coba tebak jenis fungsinya.
            let functionType = 'fungsi';
            if (equation.includes('x^2') || equation.includes('x**2')) {
                functionType = 'fungsi kuadrat (parabola)';
            } else if (equation.includes('sin') || equation.includes('cos')) {
                functionType = 'fungsi trigonometri';
            } else if (!equation.includes('^') && !equation.includes('**')) {
                functionType = 'fungsi linear';
            }

            // Rakit jadi kalimat deskripsi.
            let description = `Grafik persamaan y = ${equation} merupakan ${functionType}. `;
            
            description += `Grafik memiliki nilai tertinggi y = ${maxY.toFixed(2)} di titik (${maxX.toFixed(1)}, ${maxY.toFixed(2)}), `;
            description += `dan nilai terendah y = ${minY.toFixed(2)} di titik (${minX.toFixed(1)}, ${minY.toFixed(2)}). `;
            
            if (xIntercepts.length > 0) {
                const uniqueIntercepts = [...new Set(xIntercepts)].slice(0, 3);
                description += `Grafik memotong sumbu X di sekitar x = ${uniqueIntercepts.join(', ')}. `;
            }
            
            description += `Grafik memotong sumbu Y di titik (0, ${yIntercept}). `;

            // Cek tren grafiknya.
            if (maxYIndex > minYIndex) {
                description += 'Grafik cenderung naik dari kiri ke kanan.';
            } else if (maxYIndex < minYIndex) {
                description += 'Grafik cenderung turun dari kiri ke kanan.';
            }

            return description;

        } catch (error) {
            return `Grafik persamaan y = ${equation} tidak dapat dianalisis secara detail. ${error.message}`;
        }
    }

    // Bikin contoh perhitungan.
    function calculateExample(originalEquation) {
        try {
            const x = 2;
            const result = evaluateEquation(originalEquation, x);
            
            // Biar enak dibaca, ganti '*' jadi '×'.
            const displayEq = originalEquation.replace(/\*/g, '×').replace(/\*\*/g, '^');
            
            return `Contoh: Untuk x = ${x}, maka y = ${displayEq} = ${result.toFixed(2)}`;
        } catch (error) {
            return `Tidak dapat menghitung contoh: ${error.message}`;
        }
    }

    // Expose fungsi-fungsi ini biar bisa dipake dari luar.
    return {
        sanitizeEquation,
        evaluateEquation,
        generateDataPoints,
        reflectX,
        reflectY,
        dilate2x,
        dilateHalfX,
        shiftRight,
        shiftLeft,
        validateEquation,
        analyzeEquation,
        calculateExample,
        applyTransformation
    };
})();

