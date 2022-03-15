(function (PKAE) {
    'use strict';

    function PKHistory(app) {

        var q = this;

        var history = [];

        var _listenFor = app.listenFor;

        q.pushApplyToHistory = function (state) {
            if (!state) return(false);
            var eventString = "Applied " + state.desc;
            if (state.meta && state.meta.length > 0)
            {
                eventString = eventString.concat(" from ", state.meta[0]);
                if (state.meta[1])
                {
                    eventString = eventString.concat(" for ", state.meta[1], " s");
                }
            }
            history.push(eventString);
            console.log(eventString);
            return(true);
        };

        q.pushUndoAndRedoToHistory = function(state, undo) {
            if (!state) return(false);
            if (undo) var eventString = "Undone ";
            else var eventString = "Redone ";
            eventString = eventString.concat(state.desc);
            history.push(eventString);
            console.log(eventString);
            return(true);
        };

        _listenFor('StateRequestPush', function(_state) {
            q.pushApplyToHistory(_state);
        });

        _listenFor('StateDidPop', function(_state, undo) {
            q.pushUndoAndRedoToHistory(_state, undo);
        });
    };

    PKAE._deps.history = PKHistory;

}) (PKAudioEditor);