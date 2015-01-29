/*
 * Based on HTML5 Sortable jQuery Plugin
 * http://farhadi.ir/projects/html5sortable
 * 
 * Original work (c) 2012, Ali Farhadi
 * Released under the MIT license.
 * 
 */
(function($) {
 var dragging, draggingHeight, draggingWidth, placeholders = $();
 $.fn.sortable = function(options) {
	var method = String(options);
	options = $.extend({
	    connectWith: false,
	    removeTarget: false,
        shims: $()
	}, options);
	return this.each(function() {
		if (/^enable|disable|destroy$/.test(method)) {
			var localitems = $(this).children($(this).data('items')).attr('draggable', method === 'enable');
			if (method === 'destroy') {
				localitems.add(this).removeData('connectWith items')
					.off('dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s');
			}
			return;
		}
	    var isHandle, index, parent, items = $(this).children(options.items), shims = $(this).children(options.shims);
		var placeholder = $('<' + (/^ul|ol$/i.test(this.tagName) ? 'li' : 'div') + ' class="sortable-placeholder">');

		items.find(options.handle).mousedown(function() {
			isHandle = true;
		}).mouseup(function() {
			isHandle = false;
		});

	    $(this).data('items', options.items);
		placeholders = placeholders.add(placeholder);
		if (options.connectWith) {
			$(options.connectWith).add(this).data('connectWith', options.connectWith);
		}
        if (options.removeTarget) {
            $(options.removeTarget).data('removeTarget', options.removeTarget);
        }

		items.attr('draggable', 'true').on('dragstart.h5s', function(e) {
			if (options.handle && !isHandle) {
				return false;
			}
			isHandle = false;
			var dt = e.originalEvent.dataTransfer;
			dt.effectAllowed = 'move';
			dt.setData('text', '');

			index = (dragging = $(this)).addClass('sortable-dragging').attr('aria-grabbed', 'true').index();
		    parent = dragging.parent();
			draggingHeight = dragging.outerHeight();
		    draggingWidth = dragging.outerWidth();
			items.parent().trigger('sortstart', { item: dragging });
		    var rt = $(options.removeTarget);
            if (rt.is(":hidden")) {
                rt.data('sortableRestoreHidden', true);
                rt.show();
            }
		}).on('dragend.h5s', function (e, evtData) {
		    if (!dragging) return;
		    evtData = $.extend({
		        remove: false
		    }, evtData);

		    var sortableEventArgs = {
		        item: (evtData.remove) ? null : dragging,
		        removed: evtData.remove
		    }
		    $(dragging).removeClass('sortable-dragging').attr('aria-grabbed', 'false').show();
		    placeholders.detach();
		    if (evtData.remove) dragging.remove();

			if (index !== dragging.index() || !parent.is(dragging.parent())) {
			    items.parent().trigger('sortupdate', sortableEventArgs);
			}
			items.parent().trigger('sortstop', sortableEventArgs);

			var rt = $(options.removeTarget);
			if (rt.data('sortableRestoreHidden')) {
			    if (evtData.remove)
			        rt.hide({effect: 'fade', duration: 400});
			    else
			        rt.hide();
			    rt.removeData('sortableRestoreHidden');
			}
			dragging = null;
		    $(window).resize();
		}).add(options.removeTarget).not('a[href], img').on('selectstart.h5s', function () {
			this.dragDrop && this.dragDrop();
			return false;
		}).end().add([this, placeholder]).on('dragover.h5s dragenter.h5s drop.h5s', function(e) {
			if (!items.is(dragging) && options.connectWith !== $(dragging).parent().data('connectWith')) {
				return true;
			}
			if (e.type === 'drop') {
			    e.stopPropagation();
			    if (options.removeTarget === $(this).data('removeTarget')) {
			        var dragged = $(dragging);
			        placeholder.show();
			        var evt = jQuery.Event('sortremove');
			        items.parent().trigger(evt, { item: dragged });
			        if (!evt.isDefaultPrevented()) {
			            dragged.trigger('dragend.h5s', {remove: true});
			            dragged.remove();
			            $(this).removeClass('sortable-over');
			            return false;
			        }
			    }
			    placeholders.filter(':visible').after(dragging);
			    dragging.trigger('dragend.h5s');
				return false;
			}
			e.preventDefault();
			e.originalEvent.dataTransfer.dropEffect = 'move';
			if (items.is(this) || shims.is(this)) {
			    var thisHeight = $(this).outerHeight();
			    var thisWidth = $(this).outerWidth();
			    if (options.forcePlaceholderSize === 'dragged' || options.forcePlaceholderSize === true) {
			        placeholder.height(draggingHeight);
			        placeholder.width(draggingWidth);
			    }

			    if (options.forcePlaceholderSize === 'target' && !shims.is(this)) {
			        placeholder.height($(this).height());
			        placeholder.width($(this).width());
			    }
                
			    // Check if $(this) is bigger than the draggable. If it is, we have to define a dead zone to prevent flickering
			    if (thisHeight + 10 > draggingHeight) {
			        // Dead zone?
			        var deadZone = thisHeight - draggingHeight, offsetTop = $(this).offset().top;
			        if (placeholder.index() < $(this).index() && e.originalEvent.pageY < offsetTop + deadZone) {
			            return false;
			        }
			        else if (placeholder.index() > $(this).index() && e.originalEvent.pageY > offsetTop + thisHeight - deadZone) {
			            return false;
			        }
			    }

			    //if (thisWidth + 10 > draggingWidth) {
			    //    // Dead zone?
			    //    var deadZone = thisWidth - draggingWidth, offsetLeft = $(this).offset().left;
			    //    if (placeholder.index() < $(this).index() && e.originalEvent.pageX < offsetLeft + deadZone) {
			    //        return false;
			    //    }
			    //    else if (placeholder.index() > $(this).index() && e.originalEvent.pageX > offsetLeft + thisWidth - deadZone) {
			    //        return false;
			    //    }
			    //}

			    dragging.hide();
			    $(this)[placeholder.index() < $(this).index() && !shims.is(this) ? 'after' : 'before'](placeholder);
			    placeholders.not(placeholder).detach();
			} else if (!placeholders.is(this) && !$(this).children(options.items).length) {
				placeholders.detach();
				$(this).append(placeholder);
			} else if (options.removeTarget === $(this).data('removeTarget')) {
			    $(this).addClass('sortable-over');
			    placeholder.hide();
			}
			return false;
		});
	    $(options.removeTarget).on('dragleave.h5s', function() {
	        $(this).removeClass('sortable-over');
	        placeholder.show();
	    });
	});
};
})(jQuery);
