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
                    //if (state.meta[2]) eventString = eventString.concat("with the following param(s): ", state.meta[2].toString());
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

        q.getEventParams = function(state) {
            var out = '';
            switch (state.name) {
                case 'RequestActionFX_GAIN':
                    out += '\t* Gain multiplier: ' + state.meta[2][0];
                    return out;
                case 'RequestActionFX_HardLimit':
                    out += '\t* Hard limit: ' + state.meta[2][0] + '\n';
                    out += '\t* Limit to : ' + state.meta[2][1] + '\n';
                    out += '\t* Ratio between lows and highs: ' + state.meta[2][2] + '\n';
                    out += '\t* Look ahead (ms): ' + state.meta[2][3];
                    return out;
                case 'RequestActionFX_DISTORT':
                    out += '\t* Distortion value: ' + state.meta[2][0];
                    return out;
                case 'RequestActionFX_DELAY':
                    out += '\t* Delay time: ' + state.meta[2][0] + '\n';
                    out += '\t* Feedback: ' + state.meta[2][1] + '\n';
                    out += '\t* Wet: ' + state.meta[2][2];
                    return out;
                case 'RequestActionFX_REVERB':
                    out += '\t* Time: ' + state.meta[2][0] + '\n';
                    out += '\t* Decay: ' + state.meta[2][1] + '\n';
                    out += '\t* Wet: ' + state.meta[2][2];
                    return out;
                case 'RequestActionFX_Compressor':
                    out += '\t* Threshold: ' + state.meta[2][0] + '\n';
                    out += '\t* Knee: ' + state.meta[2][1] + '\n';
                    out += '\t* Ratio: ' + state.meta[2][2] + '\n';
                    out += '\t* Attack: ' + state.meta[2][3] + '\n';
                    out += '\t* Release: ' + state.meta[2][4];
                    return out;
                case 'RequestActionFX_Normalize':
                    out += '\t* Normalize L/R equally: ' + state.meta[2][0] + '\n';
                    out += '\t* Normalize to: ' + state.meta[2][0];
                    return out;
                case 'RequestActionFX_SPEED':
                    out += '\t* Playback rate: ' + state.meta[2];
                    return out;
            }
            return;
        }

        q.exportHistory = function() {
            //_fireEvent("WIllDownloadFile");
            if (!history) return;
            var out = "";
            var j = 0;
            for (let i = 0; i < history.length; i++) {
                if(history[i].state.active) {
                    out += (j+1).toString() + '. ' + history[i].message;
                    if (history[i].state.meta[2] && (history[i].state.name !== 'RequestActionFX_PARAMEQ')) {
                        out = out.concat("with the following param(s): \n");
                        out += q.getEventParams(history[i].state);
                    }
                    j++;
                }
                out += '\n';
            }
            console.log(out);
            var blob = new Blob([out], {type:'text/plain;charset=utf-8'});
            var url = (window.URL || window.webkitURL).createObjectURL(blob);

			var a = document.createElement( 'a' );
			a.href = url;
			a.download = 'history.md';
			a.style.display = 'none';
			document.body.appendChild( a );
			a.click();
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

        _listenFor('ExportHistory', function() {
            q.exportHistory();
        });
    };

    PKAE._deps.history = PKHistory;

}) (PKAudioEditor);