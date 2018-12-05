/**
 * Simple kitchen timer
 * @return {object}
 */
var kitchenTimer = function() {
    var my = {};
    my.secondsToRun = 0;
    my.isTicking = false;

    return {

        /**
         * @param {string | number} minutes
         */
        windUpToMinutes: function(minutes) {
            minutes = parseInt(minutes, 10);
            if (minutes < 0 || typeof minutes != 'number') {
                minutes = 0;
            }

            my.secondsToRun = minutes * 60;
        },

        /**
         * @returns {number}
         */
        getMinutesRemaining: function() {
            return Math.floor(my.secondsToRun / 60);
        },

        /**
         * @returns {number}
         */
        getSecondsRemaining: function() {
            return my.secondsToRun - (this.getMinutesRemaining() * 60);
        },

        /**
         * Tick one second
         */
        tick: function() {
            if (my.secondsToRun == 0) {
                my.isTicking = false;
            } else {
                my.secondsToRun -= 1;
                my.isTicking = true;
            }
        },

        /**
         * @returns {boolean}
         */
        stopped: function() {
            return my.isTicking == false;
        },

        /**
         * @returns {boolean}
         */
        ticking: function() {
            return my.isTicking;
        }
    };
};


/**
 * jQuery bindings for Kitchen Timer and browser specific functions
 * @returns {object} kitchenTimerView
 */
var kitchenTimerView = function() {
    var my = {
        notificationsEnabled: false,
        title: $("title"),
        secondsRemaining: $("#seconds-remaining"),
        minutesRemaining: $("#minutes-remaining"),
        timerSubmitForm: $("#timer-submit-form"),
        numberInput: $("#number-input"),
        timerSound: $("#timer-sound")
    };

    /**
     * @param {number} number
     * @param {number} size
     * @returns {string}
     */
    my.zeroPad = function(number, size) {
        var padded = number + "";
        while (padded.length < size) {
            padded = "0" + padded;
        }

        return padded;
    };

    /**
     * @returns {boolean}
     */
    my.canPlaySound = function() {
        if (typeof my.timerSound[0] != "object") {
            return false;
        }
        else if (typeof my.timerSound[0].play != "function") {
            return false;
        }

        return true;
    };

    return {

        /**
         * @param {string} title
         * @param {string} body
         */
        sendNotification: function(title, body) {
            if (my.notificationsEnabled == false) {
                return;
            }

            new Notification(title, { body: body });
        },

        /**
         * Play html5 audio
         */
        playSound: function() {
            if (my.canPlaySound()) {
                my.timerSound[0].play();
            }
        },

        /**
         * Android Chrome does not allow applications to play HTML5 audio without
         * an action by the user, so the audio is loaded via click and can
         * than be played when the timer is up.
         */
        loadSound: function() {
            if (my.canPlaySound()) {
                my.timerSound[0].load();
            }
        },

        /**
         * Check if browser notifications are enabled
         */
        notificationsCheck: function() {
            if (typeof Notification != "function") {
                return;
            }

            if (Notification.permission === "denied") {
                return;
            }

            if (Notification.permission === "granted") {
                my.notificationsEnabled = true;
                return;
            }

            Notification.requestPermission(function(permission) {
                if (permission === "granted") {
                    my.notificationsEnabled = true;
                }
            });
        },

        /**
         * @param {string} newTitle
         * @returns {object}
         */
        setTitle: function(newTitle) {
            my.title.html(newTitle);
            return this;
        },

        /**
         * @param {number} minutes
         * @param {number} seconds
         * @param {string} postfix
         */
        setTitleByTime: function(minutes, seconds, postfix) {
            var title = minutes + ":" + my.zeroPad(seconds, 2) + " - " + postfix;
            this.setTitle(title);
        },

        /**
         * @param {number} secondsRemaining
         * @returns {object}
         */
        setSecondsRemaining: function(secondsRemaining) {
            my.secondsRemaining.html(my.zeroPad(secondsRemaining, 2));
            return this;
        },

        /**
         * @param {number} minutesRemaining
         * @returns {object}
         */
        setMinutesRemaining: function(minutesRemaining) {
            my.minutesRemaining.html(minutesRemaining);
            return this;
        },

        /**
         * @param {function} submitEvent
         * @returns {object}
         */
        setFormSubmitEvent: function(submitEvent) {
            my.timerSubmitForm.submit(function(event) {
                event.preventDefault();
                submitEvent();
            });

            return this;
        },

        /**
         * @returns {jQuery}
         */
        getNumberInput: function() {
            return my.numberInput;
        },

        /**
         * @returns {string}
         */
        getMinutesToWindUpTo: function() {
            return my.numberInput.val();
        },

        /**
         * @param {string} number
         * @returns {object}
         */
        setNumberInput: function(number) {
            my.numberInput.val(number);
            return this;
        }
    }
};


/**
 * Logic for kitchenTimerView
 *
 * @param {object} view
 * @param {object} timer
 * @returns {object}
 */
var kitchenTimerViewModel = function(view, timer) {
    var my = {
        applicationName: "Kitchen Timer",
        timer: timer,
        view: view,
        interval: 0
    };

    my.updateTickingTitle = function() {
        my.view.setTitleByTime(
            my.timer.getMinutesRemaining(),
            my.timer.getSecondsRemaining(),
            my.applicationName
        );
    };

    my.windUp = function() {
        var minutes = my.view.getMinutesToWindUpTo();

        my.timer.windUpToMinutes(minutes);
        my.view.loadSound();
        my.view.setNumberInput(minutes);
        my.view.setSecondsRemaining(my.timer.getSecondsRemaining());
        my.view.setMinutesRemaining(my.timer.getMinutesRemaining());
        my.updateTickingTitle();
    };

    my.tick = function() {
        my.timer.tick();

        if (my.timer.stopped()) {
            my.view.sendNotification(my.applicationName, "Time is up");
            my.view.playSound();
        }

        my.view.setSecondsRemaining(my.timer.getSecondsRemaining());
        my.view.setMinutesRemaining(my.timer.getMinutesRemaining());
        my.updateTickingTitle();
    };

    my.startTicking = function() {
        if (my.interval) {
            window.clearInterval(my.interval);
        }

        my.interval = window.setInterval(function () {
            my.tick();
            if (timer.stopped()) {
                window.clearInterval(my.interval);
            }
        }, 1000);
    };

    /** Run notifications check once */
    my.view.notificationsCheck();

    /** Set focus */
    my.view.getNumberInput().focus();

    return {
        enableFormSubmit: function () {
            my.view.setFormSubmitEvent(function() {
                my.windUp();
                my.startTicking();
            });
        }
    }
};
