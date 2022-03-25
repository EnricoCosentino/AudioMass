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

        q.cleanInactiveHistory = function() {
            var i = history.length - 1;
            console.log(history);
            while(history[i] && !history[i].state.active) {
                history.pop();
                i--;
                console.log(history);
                console.log(i);
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
                    if (state.meta[2]) eventString = eventString.concat("with the following param(s): ", state.meta[2].toString());
                }
            }
            var event = {'message':eventString, 'state':state};
            q.cleanInactiveHistory();
            history.push(event);
            console.log(event);
            return(true);
        };

        //Metodo da rimuovere assieme alla vecchia gestione degli stati
        q.pushUndoAndRedoToHistory = function(state, undo) {
            if (!state) return(false);
            if (undo) var eventString = "Undone ";
            else var eventString = "Redone ";
            eventString = eventString.concat(state.desc);
            var event = {'message':eventString, 'state':state};
            q.cleanInactiveHistory();
            history.push(event);
            console.log(event);
            return(true);
        };

        q.changeHistory = function(changedEventsIndices) {
            changingHistory = true;
            console.log(changedEventsIndices);
            for (let i = 0; i < changedEventsIndices.length; i++) {
                history[changedEventsIndices[i]].state.active = !history[changedEventsIndices[i]].state.active;
            }
            currentPoint = 0;
            /*for (let i = 0; i < history.length; i++) {
                if (history[i] && (!history[i].state.active || i === oldestChangedEvent)) {
                    currentPoint = i;
                    break;
                }
            }*/
            q.setStateBack(currentPoint);
            console.log("State set back to index " + currentPoint);
            //q.redoOperations();
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
                    console.log('Redoing operation at index ' + currentPoint);
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
    };

    PKAE._deps.history = PKHistory;

}) (PKAudioEditor);