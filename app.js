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
		
		$(".songDetails").empty();
        $(".selector").empty();
        $(".recommended").empty();

        for (var i = 0; i < 10; i++) {
        	var preview = '';
	        if(data.tracks.items[i].preview_url != null) {
	        	preview = "<audio controls class='previewPlayer_selector preview-" + i + "' controlsList='nodownload'><source src='" + data.tracks.items[i].preview_url +"' type ='audio/mpeg'></audio>"
	        } else {
	        	preview = '';
			}

			var like = "<i onClick='like(this)' class='far fa-heart heart_selector'></i>";
			
			var trackName = data.tracks.items[i].name;
			if(trackName.length > 70) {
				trackName = trackName.substr(0,70) + "...";
			} 

			var like = '';

			if(!idExist(data.tracks.items[i].id)) {
				like = "<i onClick='like(this)' class='far fa-heart heart_selector'></i>";
			} else {
				like = "<i onClick='like(this)' class='fas fa-heart heart_selector liked'></i>";
			}

			$(".selector").append("<div onClick='clearResults(event, this)' class='card item item-" + i + "'><img class='albumArt' src='" + data.tracks.items[i].album.images[0].url + "'>" +
				                  "<div class='nameInfo'><p class='artist'>" + data.tracks.items[i].artists[0].name + 
				                  "</p><p class='song'>" + trackName + "</p></div>" + preview + like + "<i class='fas fa-arrow-right arrow-continue icon'></i><p class='hidden hidden-" + i +"'>" + data.tracks.items[i].id + "</p></div><br>");
		}

        return data.tracks.items;
    }

    const _getSongById = async(token, id) => {

    	displayLoading();

		$(".selector").empty();
    	$(".songDetails").empty();
    	$(".recommended").empty();

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

        const duration = await millisToMinutesAndSecond(dataAnalysis.duration_ms);
		const keys = await getMusicKey(dataAnalysis.key, dataAnalysis.mode);
		const date = await formatDate(new Date(dataSong.album.release_date));
		var preview = '';
        if(dataSong.preview_url != null) {
        	preview = "<audio controls class='previewPlayer' controlsList='nodownload'><source src='" + dataSong.preview_url +"' type ='audio/mpeg'></audio>"
        } else {
        	preview = '';
        }
		var tempo = dataAnalysis.tempo + '';

        $(".songDetails").append("<div class='songInfo'><i onClick='like(this)' class='far fa-heart heart'></i><img class='albumArtDetail' src='" + dataSong.album.images[0].url + "'><h2>" + dataSong.album.artists[0].name + "</h2><br>" +
			"<h3>" + dataSong.name + "</h3><br><table><tr><td>Track length <b>" + duration + "</b></td><td>Key <b>" + keys[0] + "</b></td></tr><tr><td>Camelot <b>" + keys[1] + "</b></td>"
			+"<td>Release Date <b>" + date + "</b></td></tr>"
			+ "<tr><td>Tempo <b>" + tempo.split('.')[0] + " BPM</b></td>"
			+ "<td>Album <b>" + dataSong.album.name + "</b></td></tr></table></div>"
			+ preview
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

		$(".recommended").append("<h5>Similar songs</h5>");

		var loadSimilar = await _getSimilar(await _getToken(), id);


		loadItems();

		if (items !== undefined || items.length != 0) {
	    	if(idExist(id)) {
	    		$(".heart").toggleClass('liked');
				$(".heart").toggleClass("far fas");
	    	}
		}

		hideLoading();

        return dataSong;

	}

	const _getFavorites = async (token) => {

		displayLoading();

		$(".songDetails").empty();
        $(".selector").empty();
        $(".recommended").empty();

		loadItems();
		var favorites = items;
		var countFavorites = favorites.length;

		if (items === undefined || items.length == 0) {
			$(".selector").append("<h2>You don't have any favorite tracks yet</h2>");
		} else {
			$(".selector").append("<h2>My Favorites</h2>");
			for(var i = 0; i < items.length; i++) {
	    		const result = await fetch('https://api.spotify.com/v1/tracks/' + items[i], {
		            method: 'GET',
		            headers: { 'Authorization' : 'Bearer ' + token}
		        });

		        const data = await result.json();

		        var index = i + countFavorites;
		        var preview = '';
		        if(data.preview_url != null) {
		        	preview = "<audio controls class='previewPlayer_selector' controlsList='nodownload'><source src='" + data.preview_url +"' type ='audio/mpeg'></audio>"
		        } else {
		        	preview = '';
				}
				
				var trackName = data.name;
				if(trackName.length > 70) {
					trackName = trackName.substr(0,70) + "...";
				} 

				var like = '';

				if(!idExist(data.id)) {
					like = "<i onClick='like(this); refreshFavorites();' class='far fa-heart heart_selector'></i>";
				} else {
					like = "<i onClick='like(this); refreshFavorites();' class='fas fa-heart heart_selector liked'></i>";
				}


		        $(".selector").append("<div onClick='clearResults(event, this)' class='card item item-" + i + "'><img class='albumArt' src='" + data.album.images[0].url + "'>" +
				                  "<div class='nameInfo'><p class='artist'>" + data.artists[0].name + 
				                  "</p><p class='song'>" + trackName + "</p></div>" + preview + like + "<i class='fas fa-arrow-right arrow-continue icon'></i><p class='hidden hidden-" + i +"'>" + data.id + "</p></div><br>");
	        }

	        if(countFavorites > 5) {
	        	favorites = await getRandomFromArray(favorites, 5);
	        }

	        $(".recommended").append("<h5>Songs you might like</h5>");

			var loadSimilar = await _getSimilar(await _getToken(), favorites, true);
		}

		hideLoading();
    }

    _getSimilar = async (token, seed, isInFavorites) => {

    	const resultRecommended = await fetch('https://api.spotify.com/v1/recommendations?limit=10&seed_tracks=' + seed, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const dataRecommended = await resultRecommended.json();

		var countFavorites = items.length;

        for (var i = 0; i < 10; i++) {
        	var index = i + countFavorites;
			var preview = '';
	        if(dataRecommended.tracks[i].preview_url != null) {
	        	preview = "<audio controls class='previewPlayer_selector' controlsList='nodownload'><source src='" + dataRecommended.tracks[i].preview_url +"' type ='audio/mpeg'></audio>"
	        } else {
	        	preview = '';
			}
			
			var trackName = dataRecommended.tracks[i].name
			if(trackName.length > 70) {
				trackName = trackName.substr(0,70) + "...";
			} 

			var like = '';
			if(!idExist(dataRecommended.tracks[i].id)) {
				if(isInFavorites) {
					like = "<i onClick='like(this); refreshFavorites();' class='far fa-heart heart_selector'></i>";
				} else {
					like = "<i onClick='like(this)' class='far fa-heart heart_selector'></i>";
				}
			} else {
				if(isInFavorites) {
					like = "<i onClick='like(this); refreshFavorites();' class='fas fa-heart heart_selector liked'></i>";
				} else {
					like = "<i onClick='like(this)' class='fas fa-heart heart_selector liked'></i>";
				}
			}

			$(".recommended").append("<div onClick='clearResults(event, this)' class='card item item-" + index + "'><img class='albumArt' src='" + dataRecommended.tracks[i].album.images[0].url + "'>" +
				                  "<div class='nameInfo'><p class='artist'>" + dataRecommended.tracks[i].artists[0].name + 
				                  "</p><p class='song'>" + trackName + "</p></div>" + preview + like + "<i class='fas fa-arrow-right arrow-continue icon'></i><p class='hidden hidden-" + index +"'>" + dataRecommended.tracks[i].id + "</p></div><br>");
		}
    }

    _getRandom = async () => {

    	loadItems();

    	var favorites = items;
		var countFavorites = favorites.length;

		if(countFavorites > 5) {
        	favorites = await getRandomFromArray(favorites, 5);
        }

    	if (items === undefined || items.length == 0) {
    		_getRandomSearch(await _getToken());

		} else {

			$(".recommended").append("<h5>Recommended for you</h5>");

			_getSimilar(await _getToken(), favorites);
		}
    }

    const _getRandomSearch = async(token) => {
		const characters = 'abcdefghijklmnopqrstuvwxyz';
		const randomOffset = Math.floor(Math.random() * 100);

		const randomCharacter = characters.charAt(Math.floor(Math.random() * characters.length));
		let randomSearch = '';

		randomSearch = randomCharacter;

		const resultRandom = await fetch('https://api.spotify.com/v1/search?query=' + randomSearch +  '&type=track&offset=' + randomOffset + '&limit=10', {
			method: 'GET',
			headers: { 'Authorization' : 'Bearer ' + token}
		});

		const data = await resultRandom.json();

		for (var i = 0; i < 10; i++) {
			var preview = '';

			if(data.tracks.items[i].preview_url != null) {
				preview = "<audio controls class='previewPlayer_selector' controlsList='nodownload'><source src='" + data.tracks.items[i].preview_url +"' type ='audio/mpeg'></audio>"
			} else {
				preview = '';
			}

			var trackName = data.tracks.items[i].name;
			if(trackName.length > 70) {
				trackName = trackName.substr(0,70) + "...";
			} 

			var like = '';

			if(!idExist(data.tracks.items[i].id)) {
				like = "<i onClick='like(this)' class='far fa-heart heart_selector'></i>";
			} else {
				like = "<i onClick='like(this)' class='fas fa-heart heart_selector liked'></i>";
			}

			$(".selector").append("<div onClick='clearResults(event, this)' class='card item item-" + i + "'><img class='albumArt' src='" + data.tracks.items[i].album.images[0].url + "'>" 
				+ "<div class='nameInfo'><p class='artist'>" + data.tracks.items[i].artists[0].name
				+ "</p><p class='song'>" + trackName + "</p></div>" + preview + like + "<i class='fas fa-arrow-right arrow-continue icon'></i><p class='hidden hidden-" + i +"'>" + data.tracks.items[i].id + "</p></div><br>"
			);
		}
	}

    const getRandomFromArray = async(arr, n) => {
	    var result = new Array(n),
	        len = arr.length,
	        taken = new Array(len);
	    if (n > len)
	        throw new RangeError("getRandom: more elements taken than available");
	    while (n--) {
	        var x = Math.floor(Math.random() * len);
	        result[n] = arr[x in taken ? taken[x] : x];
	        taken[x] = --len in taken ? taken[len] : len;
	    }
	    return result;
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
        },
        getSimilar(token, seed) {
        	return _getSimilar(token, seed);
        },
        getRandom() {
        	return _getRandom();
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

    const loadSimilar = async (seed) => {
        const token = await APICtrl.getToken();           
        await APICtrl.getSimilar(token, seed);
    }
    const loadRandom = async () => {
    	await APICtrl.getRandom();
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
        showSimilar() {
        	loadSimilar(seed);
        },
        populateHomepage() {
        	loadRandom();
        }

    }

})(APIController);
