/**
 * 
 */
L.Control.customBox = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leflet-control-monitor');
        container.innerHTML = "<b>Last update:</b> <span id='lbl_last_update'></span";
        return container;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});
L.Control.theBox = function(opts) {
    return new L.Control.customBox(opts);
};
