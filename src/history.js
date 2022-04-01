(function (PKAE) {
    'use strict';

    function PKHistory(app) {
        var history = [];
        var currentPoint = -1;
        var changingHistory = false;
        var q = this;

        var _fireEvent = app.fireEvent;
        var _listenFor = app.listenFor;

        q.getHistory = function() {return history;};

        q.resetHistory = function() {history = [];}

        q.cleanInactiveHistory = function() {
            var i = history.length - 1;
            while(history[i] && !history[i].state.active) {
                history.pop();
                i--;
            }
        }

        q.pushApplyToHistory = function (state) {
            if (!state) return(false);
            var eventString = "Applied " + state.desc;
            if (state.meta && state.meta.length > 0)
            {
                eventString = eventString.concat(" from ", state.meta[0]);
                if (state.meta[1])
                {
                    eventString = eventString.concat(" for ", state.meta[1], " s ");
                    // if (state.meta[2]) eventString = eventString.concat("with the following param(s): ", state.meta[2].toString());
                }
            }
            var event = {'message':eventString, 'state':state};
            q.cleanInactiveHistory();
            history.push(event);
            return(true);
        };

        q.changeHistory = function(changedEventsIndices) {
            changingHistory = true;
            for (let i = 0; i < changedEventsIndices.length; i++) {
                history[changedEventsIndices[i]].state.active = !history[changedEventsIndices[i]].state.active;
            }
            currentPoint = 0;
            q.setStateBack(currentPoint);
        };

        q.setStateBack = function(index) {
            if(!history[index]) return (false);
            _fireEvent('SetStateTo', history[index].state);
        };

        q.nextOperation = function() {
            while(history[currentPoint] && !history[currentPoint].state.active) currentPoint++;
            if(history[currentPoint]) _fireEvent('RedoOperation', history[currentPoint].state);
            if(!history[currentPoint]) changingHistory = false;
        }

        q.redoOperations = function() {
            while (history[currentPoint]) {
                if (history[currentPoint].state.active) {
                    _fireEvent('RedoOperation', history[currentPoint].state);
                }
                currentPoint++;
            }
            lastNewState = null;
        }

        _listenFor('StateRequestPush', function(_state) {
            q.pushApplyToHistory(_state);
        });

        _listenFor('StateDidPop', function(_state, undo) {
            q.pushUndoAndRedoToHistory(_state, undo);
        });

        _listenFor('RequestActionEditHistory', function(changedEventsIndices) {
            q.changeHistory(changedEventsIndices);
        });

        _listenFor('NextHistoryOperation', function() {
            if (changingHistory) q.nextOperation();
        });

        _listenFor('IncreaseHistoryCounter', function() {
            currentPoint++;
        })

        _listenFor('DeactivateCurrentEvent', function(){
            if (history[currentPoint]) history[currentPoint].state.active = false; 
        });

        _listenFor('DeactivateSubsequentEvents', function() {
            currentPoint++;
            while(history[currentPoint]) {
                history[currentPoint].state.active = false;
                currentPoint++;
            }
        });

        _listenFor('ResetHistory', function() {
            q.resetHistory();
        });
    };

    PKAE._deps.history = PKHistory;

}) (PKAudioEditor);