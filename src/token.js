export default async function fetchData(id, endpoint, scope) {
    const token = await getToken(id, scope);

    const result = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    const data = await result.json();
    if(data.error){
        if (data?.error.status >= 402){
            sessionStorage.removeItem("token");
            window.location.search = "";
            throw new Error("Failed");
        }
        else if (data?.error.message.includes('expired')){
            console.log("expired");
            setRefresh(id);
            setTimeout(function(){
                window.location.search="";
            },3000);
        }
        else if (data?.error.message.toLowerCase().includes('invalid')){
            console.log(data);
            console.log("invalid")
            sessionStorage.removeItem("token");
            setTimeout(function(){
                window.location.search="";
            },1000);
        }
    }
    else{
        return data;
    }
}
async function setRefresh(clientId){
	const refreshToken = sessionStorage.getItem("refresh");
	const verifier = sessionStorage.getItem("verifier");
	const params = new URLSearchParams();
	params.append("client_id", clientId);
	params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);
	params.append("redirect_uri", "http://localhost:3000/callback");
    params.append("code_verifier", verifier);

	const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });
	const newTokenData = await result.json();
	console.log(newTokenData);
	sessionStorage.setItem("token", newTokenData.access_token);
}

async function getToken(id, scope){
    const clientId = id;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    
    if (!code) {
        redirectToAuthCodeFlow(clientId);
    }
    else{
        let accessToken;
        if(sessionStorage.getItem("token") === null){
            accessToken = await getAccessToken(clientId, code);
        }
        else {
            accessToken = sessionStorage.getItem("token");
        }
        return accessToken;
    }

    async function redirectToAuthCodeFlow(clientId) {
        const verifier = generateCodeVerifier(128);
        const challenge = await generateCodeChallenge(verifier);

        sessionStorage.setItem("verifier", verifier);

        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("response_type", "code");
        params.append("redirect_uri", "http://localhost:3000/callback");
        params.append("scope", scope);
        params.append("code_challenge_method", "S256");
        params.append("code_challenge", challenge);

        document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;

        function generateCodeVerifier(length) {
            let text = '';
            let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

            for (let i = 0; i < length; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        }

        async function generateCodeChallenge(codeVerifier) {
            const data = new TextEncoder().encode(codeVerifier);
            const digest = await window.crypto.subtle.digest('SHA-256', data);
            return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        }
    }

    async function getAccessToken(clientId, code) {
        const verifier = sessionStorage.getItem("verifier");

        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("redirect_uri", "http://localhost:3000/callback");
        params.append("code_verifier", verifier);

        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });
        const tokenData = await result.json();
        const accessToken = tokenData.access_token;
        sessionStorage.setItem("token", accessToken);
        sessionStorage.setItem("refresh", tokenData.refresh_token);
        return accessToken;
    }
}