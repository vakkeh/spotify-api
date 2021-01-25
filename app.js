const APIController = (function() {

	const clientId = '4bb7aa588e3a42599dcb8aae4a519680';
	const clientSecret = '23c36563fc1c4ac7bc1400a09ff0b44d';

	const _getToken = async () => {

		// tohle vrací klíč
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
            	// definuje typ aplikace
                'Content-Type' : 'application/x-www-form-urlencoded', 
                //tohle to k=duje
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            // metoda
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }

	const _getSongs = async (token, song) => {

        const result = await fetch('https://api.spotify.com/v1/search?query=' + song +'&type=track&offset=0&limit=10', {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        console.log(data);

        $(".selector").empty();

        for (i = 0; i < 10; i++) {
			$(".selector").append("<div class='card item'><img class='albumArt' src='" + data.tracks.items[i].album.images[0].url + "'>" +
				                  "<p class='artist'>" + data.tracks.items[i].artists[0].name + 
				                  "</p><p class='song'>" + data.tracks.items[i].name + "</p></div><br>");
		}

        return data.tracks.items;
    }

	return {
		getToken() {
            return _getToken();
        },
        getSongs(token, song) {
            return _getSongs(token, song);
        },
	}
})();

const APPController = (function(APICtrl) {

	const loadSongs = async () => {

		var song = $( "input#song" ).val();
        //get the token
        const token = await APICtrl.getToken();           
        //get the genres
        const songs = await APICtrl.getSongs(token, song);

    }

	return {
        init() {
            loadSongs(song);
        }
    }

})(APIController);

//APPController.init();

/*
	(0,1):'8B',
	(1,1):'3B',
	(2,1):'10B',
	(3,1):'5B',
	(4,1):'12B',
	(5,1):'7B',
	(6,1):'2B',
	(7,1):'9B',
	(8,1):'4B',
	(9,1):'11B',
	(10,1):'6B',
	(11,1):'1B',
	(0,0):'5A',
	(1,0):'12A',
	(2,0):'7A',
	(3,0):'2A',
	(4,0):'9A',
	(5,0):'4A',
	(6,0):'11A',
	(7,0):'6A',
	(8,0):'1A',
	(9,0):'8A',
	(10,0):'3A',
	(11,0):'10A',
*/
