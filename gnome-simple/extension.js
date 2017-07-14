const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;

/*Import tweener to do the animations of the UI elements*/
const Tweener = imports.ui.tweener;


const TW_URL = 'http://muslimsalat.com/london/daily.json?key=59e8cc147ce8af2a0ea52d976e27aa5b&jsoncallback=?';
const TW_AUTH_KEY = '59e8cc147ce8af2a0ea52d976e27aa5b';

let text, button;
let _httpSession;

/*
  Function to call when the label is opacity 0%, as the label remains as a
  UI element, but not visible, we have to delete it explicitily. So since
  the label reaches 0% of opacity we remove it from Main instance.
 */
function _hidePopin() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _showPopin() {
        /*if text not already present, we create a new UI element, using ST library, that allows us
          to create UI elements of gnome-shell.
          REFERENCE: http://developer.gnome.org/st/stable/
         */
    if (!text) {
        text = new St.Label({ style_class: 'helloworld-label', text: "السلام عليكم جاري العمل عليها" });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    /*
      we have to choose the monitor we want to display the hello world label. Since in gnome-shell
      always has a primary monitor, we use it(the main monitor)
     */
    let monitor = Main.layoutManager.primaryMonitor;

    /*
     we change the position of the text to the center of the monitor.
     */
    text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
                      Math.floor(monitor.height / 2 - text.height / 2));

    /*And using tweener for the animations, we indicate to tweener that we want
      to go to opacity 0%, in 2 seconds, with the type of transition easeOutQuad, and,
      when this animation has completed, we execute our function _hideHello.
      REFERENCE: http://hosted.zeh.com.br/tweener/docs/en-us/
     */
    Tweener.addTween(text,
                     { opacity: 10,
                       time: 3,
                       transition: 'easeOutQuad',
                       onComplete: _hidePopin });
}


const SalatTimeIndicator = new Lang.Class({
		Name: 'SalatTimeIndicator',
		Extends: PanelMenu.Button,

		_init: function () {
			this.parent(0.0, "Salat time indicator", false);
			this.buttonText = new St.Label({
				text: _("Loading..."),
				y_align: Clutter.ActorAlign.CENTER
			});
			this.actor.add_actor(this.buttonText);
			this._refresh();
		},

		_refresh: function () {
			this._loadData(this._refreshUI);
			this._removeTimeout();
			this._timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this._refresh));
			return true;
		},

		_loadData: function () {
			let params = {
				amount: '1000',
				sourceCurrency: 'CHF',
				targetCurrency: 'EUR'
			};
			_httpSession = new Soup.Session();
			let message = Soup.form_request_new_from_hash('GET', TW_URL, params);
			message.request_headers.append("X-Authorization-key", TW_AUTH_KEY);
			_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
						if (message.status_code !== 200)
							return;
						let json = JSON.parse(message.response_body.data);
						this._refreshUI(json);
					}
				)
			);
		},

		_refreshUI: function (data) {
			let txt = data.transferwisePayOut.toString();
			txt = txt.substring(0,6) + ' €';
			global.log(txt);
			this.buttonText.set_text(txt);
		},

		_removeTimeout: function () {
			if (this._timeout) {
				Mainloop.source_remove(this._timeout);
				this._timeout = null;
			}
		},

		stop: function () {
			if (_httpSession !== undefined)
				_httpSession.abort();
			_httpSession = undefined;

			if (this._timeout)
				Mainloop.source_remove(this._timeout);
			this._timeout = undefined;

			this.menu.removeAll();
		}
	}
);


function init() {
	button = new St.Bin({
		style_class: 'panel-button',
		reactive: true,
		can_focus: true,
		x_fill: true,
		y_fill: false,
		track_hover: true
	});

	textOfButton = new St.Label({text: "أوقات الصلاة"});
	button.set_child(textOfButton);

	/*
		we connect the actor signal "button-press-event" from the button to the funcion _showHello. In this manner,
		when we press the button, this signal is emitted, and we captured it and execute the _showHello function.
		You can see all signals in the clutter reference(because we are using St that implements actors from clutter, and
		this signals comes from the actor class): http://developer.gnome.org/clutter/stable/ClutterActor.html#ClutterActor.signals
	 */
	button.connect('button-press-event', _showPopin);

}

function enable() {
	Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
	Main.panel._rightBox.remove_child(button);
}
