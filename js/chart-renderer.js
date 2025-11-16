/*
  Semua urusan gambar-menggambar grafik di sini.
*/

const ChartRenderer = (function() {
    'use strict';

    let chartInstance = null;
    let currentEquation = '';
    let isGoldenMode = false; // Status easter egg

    // Inisialisasi grafik.
    function initChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error('Canvas element tidak ditemukan');
        }

        const ctx = canvas.getContext('2d');

        // Konfigurasi Chart.js.
        const config = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'y = f(x)',
                    data: [],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#3B82F6',
                    tension: 0, // Garis lurus, bukan melengkung.
                    fill: true
                },
                {
                    label: 'y = a*f(x-h)+k',
                    data: [],
                    borderColor: '#FBBF24', // Warna kuning pembeda.
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderWidth: 3,
                    borderDash: [5, 5], // Garis putus-putus.
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#FBBF24',
                    tension: 0,
                    fill: false,
                    hidden: true // Sembunyiin dulu.
                },
                {
                    label: 'Titik Inspeksi',
                    data: [], // Nanti isinya cuma satu titik.
                    borderColor: '#FBBF24',
                    backgroundColor: '#FBBF24',
                    pointRadius: 8,
                    pointStyle: 'circle',
                    pointHoverRadius: 10,
                    showLine: false,
                    hidden: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Gak pake animasi biar cepet.
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                family: "'Segoe UI', Tahoma, sans-serif"
                            },
                            color: '#1E293B',
                            padding: 15
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return 'Koordinat';
                            },
                            label: function(context) {
                                const x = context.parsed.x;
                                const y = context.parsed.y;
                                return `(${x.toFixed(2)}, ${y.toFixed(2)})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Sumbu X',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#475569'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.2)',
                            drawBorder: true,
                            borderColor: '#94A3B8',
                            borderWidth: 2
                        },
                        ticks: {
                            color: '#475569',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Sumbu Y',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#475569'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.2)',
                            drawBorder: true,
                            borderColor: '#94A3B8',
                            borderWidth: 2
                        },
                        ticks: {
                            color: '#475569',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        };

        // Hancurin grafik lama kalo ada.
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Bikin grafik baru.
        chartInstance = new Chart(ctx, config);
        
        return chartInstance;
    }

    // Update grafik pake data baru.
    function updateChart(equation, xValues, yValues) {
        if (!chartInstance) {
            throw new Error('Chart belum diinisialisasi');
        }

        currentEquation = equation;

        // Format data biar Chart.js ngerti.
        const dataPoints = xValues.map((x, index) => ({
            x: x,
            y: yValues[index]
        }));

        // Masukin data baru.
        chartInstance.data.labels = xValues;
        chartInstance.data.datasets[0].data = dataPoints;
        chartInstance.data.datasets[0].label = `y = ${equation}`;

        // Kalo mode emas, ganti warna.
        if (isGoldenMode) {
            chartInstance.data.datasets[0].borderColor = '#D4AF37';
            chartInstance.data.datasets[0].backgroundColor = 'rgba(212, 175, 55, 0.1)';
            chartInstance.data.datasets[0].pointHoverBackgroundColor = '#D4AF37';
        } else {
            chartInstance.data.datasets[0].borderColor = '#3B82F6';
            chartInstance.data.datasets[0].backgroundColor = 'rgba(59, 130, 246, 0.1)';
            chartInstance.data.datasets[0].pointHoverBackgroundColor = '#3B82F6';
        }

        // Atur skala sumbu otomatis.
        autoScaleAxes(xValues, yValues);

        // Update grafiknya.
        chartInstance.update('none');
    }

    // Update grafik perbandingan.
    function updateComparisonChart(equation, xValues, yValues) {
        if (!chartInstance) return;

        const dataPoints = xValues.map((x, index) => ({
            x: x,
            y: yValues[index]
        }));

        chartInstance.data.datasets[1].data = dataPoints;
        chartInstance.data.datasets[1].label = `y = ${equation}`;
        chartInstance.update('none');
    }

    // Tampil/sembunyikan grafik perbandingan.
    function toggleComparisonVisibility(visible) {
        if (!chartInstance) return;
        chartInstance.data.datasets[1].hidden = !visible;
        if (!visible) {
            // Kosongin data pas disembunyiin.
            chartInstance.data.datasets[1].data = [];
        }
        chartInstance.update('none');
    }

    // Tampilkan titik inspeksi.
    function updateInspectionPoint(point) {
        if (!chartInstance) return;
        chartInstance.data.datasets[2].hidden = false;
        chartInstance.data.datasets[2].data = [point];
        chartInstance.update('none');
    }

    // Hapus titik inspeksi.
    function clearInspectionPoint() {
        if (!chartInstance) return;
        chartInstance.data.datasets[2].hidden = true;
        chartInstance.data.datasets[2].data = [];
        chartInstance.update('none');
    }

    // Atur skala sumbu otomatis biar pas.
    function autoScaleAxes(xValues, yValues) {
        if (!chartInstance || xValues.length === 0 || yValues.length === 0) {
            return;
        }

        // Cari min/max data.
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);

        // Kasih margin 10%.
        const xMargin = (maxX - minX) * 0.1;
        const yMargin = (maxY - minY) * 0.1;

        // Terapkan skala baru.
        chartInstance.options.scales.x.min = minX - xMargin;
        chartInstance.options.scales.x.max = maxX + xMargin;
        
        // Batasi sumbu Y biar grafiknya nggak aneh.
        const yMin = minY - yMargin;
        const yMax = maxY + yMargin;
        
        chartInstance.options.scales.y.min = yMin;
        chartInstance.options.scales.y.max = yMax;
    }

    // Ekspor ke Base64 PNG.
    function exportToPNG() {
        if (!chartInstance) {
            throw new Error('Tidak ada grafik untuk diekspor');
        }

        try {
            // Pake fungsi bawaan Chart.js.
            const base64Image = chartInstance.toBase64Image('image/png', 1);
            return base64Image;
        } catch (error) {
            throw new Error('Gagal mengekspor grafik: ' + error.message);
        }
    }

    // Download grafik jadi PNG.
    function downloadChart(filename = 'mathvision-graph.png') {
        try {
            const base64Image = exportToPNG();
            
            // Bikin link download palsu.
            const link = document.createElement('a');
            link.href = base64Image;
            link.download = filename;
            
            // Trigger download.
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            throw new Error('Gagal mengunduh grafik: ' + error.message);
        }
    }

    // Aktifin mode emas.
    function activateGoldenMode() {
        isGoldenMode = true;
        
        if (chartInstance && chartInstance.data.datasets[0]) {
            // Ganti warna jadi emas.
            chartInstance.data.datasets[0].borderColor = '#D4AF37';
            chartInstance.data.datasets[0].backgroundColor = 'rgba(212, 175, 55, 0.1)';
            chartInstance.data.datasets[0].pointHoverBackgroundColor = '#D4AF37';
            
            // Update grafiknya.
            chartInstance.update('active');
        }
    }

    // Matiin mode emas.
    function deactivateGoldenMode() {
        isGoldenMode = false;
        
        if (chartInstance && chartInstance.data.datasets[0]) {
            // Balikin warna ke biru.
            chartInstance.data.datasets[0].borderColor = '#3B82F6';
            chartInstance.data.datasets[0].backgroundColor = 'rgba(59, 130, 246, 0.1)';
            chartInstance.data.datasets[0].pointHoverBackgroundColor = '#3B82F6';
            
            // Update grafiknya.
            chartInstance.update('active');
        }
    }

    // Cek udah ada grafiknya belum.
    function isInitialized() {
        return chartInstance !== null;
    }

    // Ambil instance grafik sekarang.
    function getChartInstance() {
        return chartInstance;
    }

    // Hancurin grafik (hemat memori).
    function destroyChart() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    // Ganti warna buat dark mode (ga dipake sekarang).
    function updateDarkMode(isDark) {
        if (!chartInstance) return;
        
        const style = getComputedStyle(document.body);
        const textColor = style.getPropertyValue('--text-primary');
        const gridColor = '#E5E7EB';
        const borderColor = style.getPropertyValue('--border-color');

        // Update warna legenda.
        chartInstance.options.plugins.legend.labels.color = textColor;
        chartInstance.options.plugins.legend.labels.font = { family: "'Poppins', sans-serif" };

        // Update warna sumbu.
        chartInstance.options.scales.x.title.color = textColor;
        chartInstance.options.scales.x.title.font = { family: "'Poppins', sans-serif", size: 14, weight: 'bold' };
        chartInstance.options.scales.x.ticks.color = textColor;
        chartInstance.options.scales.x.ticks.font = { family: "'Poppins', sans-serif" };
        chartInstance.options.scales.x.grid.color = gridColor;
        chartInstance.options.scales.x.grid.borderColor = borderColor;
        chartInstance.options.scales.x.border = { color: borderColor, width: 2 };

        chartInstance.options.scales.y.title.color = textColor;
        chartInstance.options.scales.y.title.font = { family: "'Poppins', sans-serif", size: 14, weight: 'bold' };
        chartInstance.options.scales.y.ticks.color = textColor;
        chartInstance.options.scales.y.ticks.font = { family: "'Poppins', sans-serif" };
        chartInstance.options.scales.y.grid.color = gridColor;
        chartInstance.options.scales.y.grid.borderColor = borderColor;
        chartInstance.options.scales.y.border = { color: borderColor, width: 2 };

        // Gambar ulang grafiknya
        chartInstance.update('none'); // Update tanpa animasi
    }

    // Expose fungsi-fungsi ini.
    return {
        initChart,
        updateChart,
        updateComparisonChart,
        toggleComparisonVisibility,
        updateInspectionPoint,
        clearInspectionPoint,
        exportToPNG,
        downloadChart,
        activateGoldenMode,
        deactivateGoldenMode,
        isInitialized,
        getChartInstance,
        destroyChart,
        updateDarkMode
    };
})();

