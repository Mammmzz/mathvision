/*
  Otak utama aplikasi.
  Semua event listener dan interaksi UI ada di sini.
*/

(function($) {
    'use strict';

    // State aplikasi
    let currentEquation = 'x^2';
    let baseEquationForComparison = 'x^2';
    let isComparisonMode = false;
    let isAccessibilityMode = false;

    // Jalan pertama kali pas halaman siap.
    $(document).ready(function() {
        console.log('🎨 MathVision initialized');
        
        // Siapin grafik.
        ChartRenderer.initChart('math-chart');
        
        // Pasang semua event handler.
        setupEventHandlers();
        
        // Cek dark mode (tapi ga dipake).
        detectDarkMode();
        
        // Gambar grafik awal.
        renderGraph(currentEquation);
        
        // Tampilkan pesan selamat datang.
        showWelcomeMessage();
    });

    // Daftarin semua event handler.
    function setupEventHandlers() {
        // Validasi input real-time.
        $('#equation-input').on('input', handleInputValidation);
        
        // Pencet Enter = klik tombol.
        $('#equation-input').on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                $('#visualize-btn').click();
            }
        });
        
        // Tombol visualisasi.
        $('#visualize-btn').on('click', handleVisualize);
        
        // Tombol transformasi.
        $('#reflect-btn').on('click', handleReflect);
        $('#reflect-y-btn').on('click', handleReflectY);
        $('#dilate-btn').on('click', handleDilate);
        $('#dilate-half-btn').on('click', handleDilateHalf);
        $('#shift-btn').on('click', handleShift);
        $('#shift-left-btn').on('click', handleShiftLeft);
        
        // Tombol ekspor.
        $('#export-btn').on('click', handleExport);
        
        // Tombol aksesibilitas.
        $('#accessibility-btn').on('click', handleAccessibility);

        // Tombol bandingkan.
        $('#compare-btn').on('click', handleCompare);

        // Event listener slider.
        $('#slider-a, #slider-h, #slider-k').on('input', handleSliderChange);

        // Event listener inspeksi titik.
        $('#inspect-x-input').on('input', handlePointInspection);
    }

    // Cek validasi input.
    function handleInputValidation() {
        const input = $(this).val();
        const $errorMsg = $('#error-message');
        
        // Cek easter egg 'JUARA'.
        if (input.toUpperCase() === 'JUARA') {
            activateEasterEgg();
            return;
        }
        
        // Validasi persamaan.
        const validation = MathCore.validateEquation(input);
        
        if (input.trim() === '') {
            // Kalo kosong, biarin.
            $errorMsg.removeClass('show').text('');
        } else if (validation.valid) {
            // Kalo valid, kasih notif sukses.
            $errorMsg.addClass('show')
                     .css('background', '#D1FAE5')
                     .css('color', '#065F46')
                     .css('border', '1px solid #6EE7B7')
                     .text(validation.message);
        } else {
            // Kalo invalid, kasih notif eror.
            $errorMsg.addClass('show')
                     .css('background', '#FEE2E2')
                     .css('color', '#DC2626')
                     .css('border', '1px solid #FCA5A5')
                     .text(validation.message);
        }
    }

    // Handler tombol visualisasi.
    function handleVisualize() {
        const equation = $('#equation-input').val().trim() || 'x^2';
        const $loader = $('#loading-overlay');

        $loader.fadeIn(100);

        // Gunakan setTimeout untuk mensimulasikan proses dan memastikan loader terlihat
        setTimeout(() => {
            try {
                renderGraph(equation);
                currentEquation = equation;
                
                // Bersihin titik inspeksi.
                $('#inspect-x-input').val('');
                $('#inspect-result').text('');
                ChartRenderer.clearInspectionPoint();
                
                // Kalo lagi mode bandingin, matiin.
                if (isComparisonMode) {
                    handleCompare(); // Toggle off
                }

                // Kasih notif sukses.
                showNotification('✅ Grafik berhasil divisualisasikan!', 'success');
                showConfetti();
                
            } catch (error) {
                showNotification('❌ Error: ' + error.message, 'error');
            } finally {
                $loader.fadeOut(200);
            }
        }, 300); // Penundaan kecil untuk UX
    }

    // Fungsi utama buat gambar grafik.
    function renderGraph(equation) {
        try {
            // Bikin data titik-titik.
            const data = MathCore.generateDataPoints(equation);
            
            if (data.xValues.length === 0) {
                throw new Error('Tidak ada data untuk divisualisasikan');
            }
            
            // Update chart-nya.
            ChartRenderer.updateChart(equation, data.xValues, data.yValues);
            
            // Update contoh perhitungan.
            updateCalculationExample(equation);
            
            // Update deskripsi aksesibilitas.
            updateAccessibilityDescription(equation);

            // Kalo bukan mode aksesibilitas, tunjukin grafik.
            if (!isAccessibilityMode) {
                $('#chart-container').fadeIn();
                $('#accessibility-text').hide();
            }
            
        } catch (error) {
            throw new Error('Gagal merender grafik: ' + error.message);
        }
    }

    // Update contoh perhitungan (x=2).
    function updateCalculationExample(equation) {
        try {
            const example = MathCore.calculateExample(equation);
            $('#calculation-example').html(`<p><strong>Contoh (x=2):</strong> ${example}</p>`).show();
        } catch (error) {
            $('#calculation-example').html(`<p>Error: ${error.message}</p>`).show();
        }
    }

    // Update deskripsi aksesibilitas.
    function updateAccessibilityDescription(equation) {
        try {
            const description = MathCore.analyzeEquation(equation);
            $('#accessibility-description').text(description);
        } catch (error) {
            $('#accessibility-description').text('Tidak dapat menganalisis grafik: ' + error.message);
        }
    }

    // Handler tombol refleksi X.
    function handleReflect() {
        try {
            const equation = $('#equation-input').val().trim() || currentEquation;
            const transformed = MathCore.reflectX(equation);
            
            // Ubah tulisan di kotak input
            $('#equation-input').val(transformed);
            
            // Gambar ulang grafiknya
            renderGraph(transformed);
            currentEquation = transformed;
            
            showNotification('🔄 Refleksi terhadap sumbu X diterapkan!', 'success');
        } catch (error) {
            showNotification('❌ Error transformasi: ' + error.message, 'error');
        }
    }

    // Handler tombol refleksi Y.
    function handleReflectY() {
        try {
            const equation = $('#equation-input').val().trim() || currentEquation;
            const transformed = MathCore.reflectY(equation);
            
            // Ubah tulisan di kotak input
            $('#equation-input').val(transformed);
            
            // Gambar ulang grafiknya
            renderGraph(transformed);
            currentEquation = transformed;
            
            showNotification('🔄 Refleksi terhadap sumbu Y diterapkan!', 'success');
        } catch (error) {
            showNotification('❌ Error transformasi: ' + error.message, 'error');
        }
    }

    // Handler tombol dilatasi 2x.
    function handleDilate() {
        try {
            const equation = $('#equation-input').val().trim() || currentEquation;
            const transformed = MathCore.dilate2x(equation);
            
            // Ubah tulisan di kotak input
            $('#equation-input').val(transformed);
            
            // Gambar ulang grafiknya
            renderGraph(transformed);
            currentEquation = transformed;
            
            showNotification('⚡ Dilatasi 2x diterapkan!', 'success');
        } catch (error) {
            showNotification('❌ Error transformasi: ' + error.message, 'error');
        }
    }

    // Handler tombol dilatasi 1/2x.
    function handleDilateHalf() {
        try {
            const equation = $('#equation-input').val().trim() || currentEquation;
            const transformed = MathCore.dilateHalfX(equation);
            
            // Ubah tulisan di kotak input
            $('#equation-input').val(transformed);
            
            // Gambar ulang grafiknya
            renderGraph(transformed);
            currentEquation = transformed;
            
            showNotification('⚡ Dilatasi 1/2x diterapkan!', 'success');
        } catch (error) {
            showNotification('❌ Error transformasi: ' + error.message, 'error');
        }
    }

    // Handler tombol geser kanan.
    function handleShift() {
        try {
            const equation = $('#equation-input').val().trim() || currentEquation;
            const transformed = MathCore.shiftRight(equation);
            
            // Ubah tulisan di kotak input
            $('#equation-input').val(transformed);
            
            // Gambar ulang grafiknya
            renderGraph(transformed);
            currentEquation = transformed;
            
            showNotification('➡️ Grafik digeser ke kanan 1 satuan!', 'success');
        } catch (error) {
            showNotification('❌ Error transformasi: ' + error.message, 'error');
        }
    }

    // Handler tombol geser kiri.
    function handleShiftLeft() {
        try {
            const equation = $('#equation-input').val().trim() || currentEquation;
            const transformed = MathCore.shiftLeft(equation);
            
            // Ubah tulisan di kotak input
            $('#equation-input').val(transformed);
            
            // Gambar ulang grafiknya
            renderGraph(transformed);
            currentEquation = transformed;
            
            showNotification('⬅️ Grafik digeser ke kiri 1 satuan!', 'success');
        } catch (error) {
            showNotification('❌ Error transformasi: ' + error.message, 'error');
        }
    }

    // Handler tombol ekspor.
    function handleExport() {
        try {
            // Bikin nama file unik.
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `mathvision-${currentEquation.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.png`;
            
            // Download chart-nya.
            ChartRenderer.downloadChart(filename);
            
            showNotification('💾 Grafik berhasil disimpan!', 'success');
        } catch (error) {
            showNotification('❌ Gagal menyimpan grafik: ' + error.message, 'error');
        }
    }

    // Handler tombol aksesibilitas.
    function handleAccessibility() {
        isAccessibilityMode = !isAccessibilityMode;
        
        if (isAccessibilityMode) {
            // Tampilkan teks, sembunyikan grafik.
            $('#chart-container').fadeOut(300, function() {
                $('#accessibility-text').fadeIn(300);
            });
            $('#accessibility-btn').addClass('active'); // Tandain tombol aktif.
            showNotification('♿ Mode aksesibel diaktifkan', 'success');
        } else {
            // Tampilkan grafik, sembunyikan teks.
            $('#accessibility-text').fadeOut(300, function() {
                $('#chart-container').fadeIn(300);
            });
            $('#accessibility-btn').removeClass('active');
            showNotification('📊 Grafik ditampilkan', 'success');
        }
    }

    // Handler tombol bandingkan.
    function handleCompare() {
        isComparisonMode = !isComparisonMode;
        if (isComparisonMode) {
            baseEquationForComparison = currentEquation;
            $('#comparison-panel').fadeIn();
            ChartRenderer.toggleComparisonVisibility(true);
            resetSliders();
            updateComparisonGraph(); 
            $('#compare-btn').text('Selesai Membandingkan').addClass('active');
            showNotification('🔍 Mode Perbandingan Aktif!', 'success');
        } else {
            $('#comparison-panel').fadeOut();
            ChartRenderer.toggleComparisonVisibility(false);
            $('#compare-btn').text('Bandingkan').removeClass('active');
            showNotification('Mode Perbandingan Nonaktif.', 'success');
        }
    }

    // Handler slider.
    function handleSliderChange() {
        if (!isComparisonMode) return;
        updateComparisonGraph();
    }

    // Update grafik perbandingan dari slider.
    function updateComparisonGraph() {
        const a = parseFloat($('#slider-a').val());
        const h = parseFloat($('#slider-h').val());
        const k = parseFloat($('#slider-k').val());

        // Update label nilai slider.
        $('#slider-a-value').text(a.toFixed(1));
        $('#slider-h-value').text(h.toFixed(1));
        $('#slider-k-value').text(k.toFixed(1));

        try {
            const transformedEq = MathCore.applyTransformation(baseEquationForComparison, a, h, k);
            const data = MathCore.generateDataPoints(transformedEq);
            
            // Format persamaan buat display.
            let displayEq = `y = ${a.toFixed(1)} * f(x - ${h.toFixed(1)}) + ${k.toFixed(1)}`;
            $('#comparison-equation').text(displayEq);

            ChartRenderer.updateComparisonChart(displayEq, data.xValues, data.yValues);
        } catch (error) {
            // Kalo eror, tampilkan pesannya.
            $('#comparison-equation').text(`Error: ${error.message}`);
        }
    }

    // Handler inspeksi titik.
    function handlePointInspection() {
        const xValueStr = $(this).val();
        
        if (xValueStr.trim() === '') {
            $('#inspect-result').text('');
            ChartRenderer.clearInspectionPoint();
            return;
        }

        const x = parseFloat(xValueStr);
        if (isNaN(x)) {
            $('#inspect-result').text('Input tidak valid');
            ChartRenderer.clearInspectionPoint();
            return;
        }

        try {
            const y = MathCore.evaluateEquation(currentEquation, x);
            if (!isFinite(y)) {
                throw new Error("Hasil tidak terdefinisi");
            }
            
            const point = { x: x, y: y };
            ChartRenderer.updateInspectionPoint(point);
            $('#inspect-result').text(`y = ${y.toFixed(3)}`);

        } catch (error) {
            $('#inspect-result').text('Error');
            ChartRenderer.clearInspectionPoint();
        }
    }

    // Reset slider.
    function resetSliders() {
        $('#slider-a').val(1);
        $('#slider-h').val(0);
        $('#slider-k').val(0);
    }

    // Aktivasi easter egg.
    function activateEasterEgg() {
        console.log('🎉 Easter egg activated: JUARA!');
        
        // Kalo lagi mode bandingin, matiin.
        if (isComparisonMode) {
            handleCompare();
        }

        // Aktifkan mode emas.
        ChartRenderer.activateGoldenMode();
        
        // Tampilkan pesan khusus.
        const $errorMsg = $('#error-message');
        $errorMsg.addClass('show')
                 .css('background', 'linear-gradient(135deg, #D4AF37 0%, #F4E5B1 100%)')
                 .css('color', '#92400E')
                 .css('border', '2px solid #D4AF37')
                 .css('font-weight', 'bold')
                 .html(`
                     <div style="text-align: center; padding: 10px;">
                         <h3>🏆 SELAMAT! 🏆</h3>
                         <p>Terima kasih kepada para juri lomba yang telah meluangkan waktu untuk mengevaluasi MathVision!</p>
                         <p style="margin-top: 10px;">
                             <em>Aplikasi ini didedikasikan untuk 50 juta siswa Indonesia yang berhak mendapatkan pendidikan berkualitas 💙🇮🇩</em>
                         </p>
                     </div>
                 `);
        
        // Tampilkan konfeti.
        showConfetti(true);
        
        // Render grafik emas.
        setTimeout(function() {
            try {
                const data = MathCore.generateDataPoints('x^2');
                ChartRenderer.updateChart('x^2', data.xValues, data.yValues);
            } catch (error) {
                console.error('Error rendering easter egg graph:', error);
            }
        }, 100);
    }

    // Tampilkan animasi konfeti.
    function showConfetti(isGolden = false) {
        const $container = $('#confetti-container');
        $container.empty();
        
        const defaultColors = ['#3B82F6', '#FBBF24', '#FFFFFF'];
        const goldenColors = ['#D4AF37', '#FFD700', '#FFA500', '#FF8C00'];
        const colors = isGolden ? goldenColors : defaultColors;

        // Bikin 50 keping konfeti.
        for (let i = 0; i < 50; i++) {
            const $confetti = $('<div class="confetti"></div>');
            
            // Atur posisi & animasi acak.
            const left = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = 3 + Math.random() * 2;
            
            // Pilih warna acak.
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            $confetti.css({
                left: left + '%',
                animationDelay: delay + 's',
                animationDuration: duration + 's',
                backgroundColor: color
            });
            
            $container.append($confetti);
        }
        
        // Hapus konfeti setelah animasi.
        setTimeout(function() {
            $container.empty();
        }, 6000);
    }

    // Tampilkan notifikasi.
    function showNotification(message, type = 'success') {
        // Bikin elemen notif kalo belum ada.
        let $notification = $('#app-notification');
        if ($notification.length === 0) {
            $notification = $('<div id="app-notification"></div>');
            $('body').append($notification);
            
            // Tambahin style.
            $notification.css({
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '16px',
                borderRadius: '12px',
                zIndex: 10000,
                maxWidth: '350px',
                fontSize: '15px',
                fontWeight: '600',
                display: 'none',
                border: '2px solid #111827',
                boxShadow: '4px 4px 0px #111827'
            });
        }
        
        // Set warna notif (sukses/eror).
        if (type === 'success') {
            $notification.css({
                background: '#A7F3D0', // Light Green
                color: '#064E3B'
            });
        } else {
            $notification.css({
                background: '#FECDD3', // Light Red
                color: '#881337'
            });
        }
        
        // Tampilkan pesannya.
        $notification.text(message).fadeIn(200);
        
        // Sembunyikan otomatis.
        setTimeout(function() {
            $notification.fadeOut(300);
        }, 3000);
    }

    // Tampilkan pesan selamat datang.
    function showWelcomeMessage() {
        setTimeout(function() {
            showNotification('👋 Selamat datang di MathVision! Mulai dengan memasukkan persamaan matematika.', 'success');
        }, 500);
    }

    // Deteksi dark mode.
    function detectDarkMode() {
        // Tema kita cuma terang, jadi ini ga ngapa-ngapain.
        ChartRenderer.updateDarkMode(false);
    }

    // Cleanup sebelum window ditutup.
    $(window).on('unload', function() {
        ChartRenderer.destroyChart();
    });

})(jQuery);
