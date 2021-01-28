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
		
		$(".songDetails").empty();
        $(".selector").empty();

        for (var i = 0; i < 10; i++) {
			$(".selector").append("<div onClick='clearResults(this)' class='card item item-" + i + "'><img class='albumArt' src='" + data.tracks.items[i].album.images[0].url + "'>" +
				                  "<div class='nameInfo'><p class='artist'>" + data.tracks.items[i].artists[0].name + 
				                  "</p><p class='song'>" + data.tracks.items[i].name + "</p></div><i class='fas fa-arrow-right arrow-continue icon'></i><p class=' hidden hidden-" + i +"'>" + data.tracks.items[i].id + "</p></div><br>");
		}

        return data.tracks.items;
    }

    const _getSongById = async(token, id) => {

    	$(".songDetails").empty();
    	$(".recommended").empty();

    	//https://api.spotify.com/v1/tracks/7mazffu6nlIv0rtRyPDMTD

    	const resultSong = await fetch('https://api.spotify.com/v1/tracks/' + id, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const resultAnalysis = await fetch('https://api.spotify.com/v1/audio-features/' + id, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const dataSong = await resultSong.json();
        const dataAnalysis = await resultAnalysis.json();
        //console.log(dataSong);
        //console.log(dataAnalysis);

        const artist_id = dataSong.album.artists[0].id;

        const duration = await millisToMinutesAndSecond(dataAnalysis.duration_ms);
		const keys = await getMusicKey(dataAnalysis.key, dataAnalysis.mode);
		const date = await formatDate(new Date(dataSong.album.release_date));
		var tempo = dataAnalysis.tempo + '';

        $(".songDetails").append("<div class='songInfo'><i onClick='like(this)' class='far fa-heart heart'></i><img class='albumArtDetail' src='" + dataSong.album.images[0].url + "'><h2>" + dataSong.album.artists[0].name + "</h2><br>" +
			"<h3>" + dataSong.name + "</h3><br><table><tr><td>Track length <b>" + duration + "</b></td><td>Key <b>" + keys[0] + "</b></td></tr><tr><td>Camelot <b>" + keys[1] + "</b></td>"
			+"<td>Release Date <b>" + date + "</b></td></tr>"
			+ "<tr><td>Tempo <b>" + tempo.split('.')[0] + " BPM</b></td>"
			+ "<td>Album <b>" + dataSong.album.name + "</b></td></tr></table></div>"
			);

		var acousticness = (Math.ceil(dataAnalysis.acousticness * 100) + '').split('.')[0];
		var danceability = (Math.ceil(dataAnalysis.danceability * 100) + '').split('.')[0];
		var energy = (Math.ceil(dataAnalysis.energy * 100) + '').split('.')[0];
		var instrumentalness = (Math.ceil(dataAnalysis.instrumentalness * 100) + '').split('.')[0];
		var liveness = (Math.ceil(dataAnalysis.liveness * 100) + '').split('.')[0];
		var loudness = dataAnalysis.loudness;
		var speechiness = (Math.ceil(dataAnalysis.speechiness * 100) + '').split('.')[0];
		var valence = (Math.ceil(dataAnalysis.valence * 100) + '').split('.')[0];
			
		$(".songDetails").append("<div class='songAnalysis'><h4>Song analysis</h4>"
		+ "<table><tr><td>Acousticness <b>" + acousticness +"%</b></td><td>Danceability <b>" + danceability + "%</b></tr>"
		+ "<tr><td>Energy <b>" + energy + "%</b></td><td>Instrumentalness <b>" + instrumentalness + "%</b></td></tr>"
		+ "<tr><td>Liveness <b>" + liveness + "%</b></td><td>Loudness <b>" + loudness + " dB</b></td></tr>"
		+ "<tr><td>Speechiness <b>" + speechiness + "%</b></td><td>Valence <b>" + valence + "%</b></td></tr></table></div>"
		+ "<p class='hidden songId'>" + id + "</p>"
		);

		const resultRecommended = await fetch('https://api.spotify.com/v1/recommendations?limit=10&seed_tracks=' + id, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const dataRecommended = await resultRecommended.json();

        console.log(dataRecommended);

        $(".recommended").append("<hr><h5>Similar songs</h5>");

        for (var i = 0; i < 10; i++) {
			$(".recommended").append("<div onClick='clearResults(this)' class='card item item-" + i + "'><img class='albumArt' src='" + dataRecommended.tracks[i].album.images[0].url + "'>" +
				                  "<div class='nameInfo'><p class='artist'>" + dataRecommended.tracks[i].artists[0].name + 
				                  "</p><p class='song'>" + dataRecommended.tracks[i].name + "</p></div><i class='fas fa-arrow-right arrow-continue icon'></i><p class=' hidden hidden-" + i +"'>" + dataRecommended.tracks[i].id + "</p></div><br>");
		}

		loadItems();

		if (items !== undefined || items.length != 0) {
	    	if(idExist(id)) {
	    		$(".heart").toggleClass('liked');
				$(".heart").toggleClass("far fas");
	    	}
		}

        return dataSong;

	}

	const _getFavorites = async (token) => {

		$(".songDetails").empty();
        $(".selector").empty();

		loadItems();

		if (items !== undefined || items.length != 0) {
			for(var i = 0; i < items.length; i++) {
	    		const result = await fetch('https://api.spotify.com/v1/tracks/' + items[i], {
		            method: 'GET',
		            headers: { 'Authorization' : 'Bearer ' + token}
		        });

		        const data = await result.json();
		        console.log(data);
		        $(".selector").append("<div onClick='clearResults(this)' class='card item item-" + i + "'><img class='albumArt' src='" + data.album.images[0].url + "'>" +
				                  "<div class='nameInfo'><p class='artist'>" + data.artists[0].name + 
				                  "</p><p class='song'>" + data.name + "</p></div><i class='fas fa-arrow-right arrow-continue icon'></i><p class=' hidden hidden-" + i +"'>" + data.id + "</p></div><br>");
	        }
		}
    }
	
	const formatDate = async (date) => {

		if (date !== undefined && date !== "") {
			var myDate = new Date(date);
			var month = [
			  "Jan",
			  "Feb",
			  "Mar",
			  "Apr",
			  "May",
			  "Jun",
			  "Jul",
			  "Aug",
			  "Sep",
			  "Oct",
			  "Nov",
			  "Dec",
			][myDate.getMonth()];
			var str = myDate.getDate() + " " + month + " " + myDate.getFullYear();
			return str;
		  }
		  return "";

	  }

    const millisToMinutesAndSecond = async (millis) => {

	  const minutes = Math.floor(millis / 60000);
	  const seconds = ((millis % 60000) / 1000).toFixed(0);

	  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
	}

	const getMusicKey = async (key, mode) => {

	  	const keys = ["C", "C♯", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

	  	var camelot = [
		    ["5A","8B"],
		    ["12A","3B"],
		    ["7A","10B"],
		    ["2A","5B"],
		    ["9A","12B"],
		    ["4A","7B"],
		    ["11A","2B"],
		    ["6A","9B"],
		    ["1A","4B"],
		    ["8A","11B"],
		    ["3A","6B"],
		    ["10A","1B"],
		];	


		var musicMode = ["Minor", "Major"];

		var musicKey = keys[key] + " " + musicMode[mode];

		var camelot = camelot[key][mode];

		var keyVars = [musicKey, camelot];

		return keyVars;

	}

	return {
		getToken() {
            return _getToken();
        },
        getSongs(token, song) {
            return _getSongs(token, song);
        },
        getSongById(token, id) {
            return _getSongById(token, id);
        },
        getFavorites(token) {
        	return _getFavorites(token);
        }
	}
})();

const APPController = (function(APICtrl) {

	const loadSongs = async () => {

		var song = $( "input#song" ).val();
        const token = await APICtrl.getToken();           
        await APICtrl.getSongs(token, song);

    }

    const loadSongById = async (id) => {

        const token = await APICtrl.getToken();           
        await APICtrl.getSongById(token, id);
    }

    const loadFavorites = async () => {
        const token = await APICtrl.getToken();           
        await APICtrl.getFavorites(token);
    }

	return {
        init() {
            loadSongs();
        },

        loadSong(id) {
        	loadSongById(id);
        },

        showFavorites() {
        	loadFavorites();
        },
        loadSimilar() {

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
