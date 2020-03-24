/**
 * 
 */
L.Control.customBox = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leflet-control-monitor');
        L.DomEvent.disableClickPropagation(container);
        container.innerHTML = "<b>Giorno:</b> <span id='lbl_last_update'></span>";
        container.innerHTML += "<div id='time-slider'><div id='time-slider-handle' class='ui-slider-handle'></div></div>";
        
        
        return container;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});
L.Control.theBox = function(opts) {
    return new L.Control.customBox(opts);
};
