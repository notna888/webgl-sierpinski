function init_vue() {
    if (typeof Vue === 'undefined') return;

    const { createApp, ref, watch } = Vue;

    // Initialize global settings if they don't exist yet
    if (!window.sierpinskiSettings) {
        window.sierpinskiSettings = {
            iterations: 5,
            canvasBg: '#000000',
            c1: '#ff0000',
            c2: '#00ff00',
            c3: '#0000ff'
        };
    }

    const app = createApp({
        setup() {
            const depth = ref(window.sierpinskiSettings.iterations);
            const htmlBg = ref('#1a1a1a');
            const canvasBg = ref(window.sierpinskiSettings.canvasBg);
            const c1 = ref(window.sierpinskiSettings.c1);
            const c2 = ref(window.sierpinskiSettings.c2);
            const c3 = ref(window.sierpinskiSettings.c3);

            // Robust background update
            watch(htmlBg, (newVal) => {
                document.body.style.backgroundColor = newVal;
            }, { immediate: true });

            // Sync settings and trigger WebGL redraw
            watch([depth, canvasBg, c1, c2, c3], () => {
                window.sierpinskiSettings.iterations = depth.value;
                window.sierpinskiSettings.canvasBg = canvasBg.value;
                window.sierpinskiSettings.c1 = c1.value;
                window.sierpinskiSettings.c2 = c2.value;
                window.sierpinskiSettings.c3 = c3.value;

                if (typeof main === 'function') main();
            });

            return { depth, htmlBg, canvasBg, c1, c2, c3 };
        }
    });

    app.component('control-group', {
        template: '<section class="control-group"><slot></slot></section>'
    });

    app.mount('body');
}


window.onload = function () {
  init_vue();
  main();
};
