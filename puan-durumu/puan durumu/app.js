fetch("https://www.sofascore.com/api/v1/unique-tournament/8/season/61643/standings/total").then(
    Response => Response.json()
).then(veri =>{
    const row = veri.standings[0].rows
    const tbody=document.querySelector("#puantablosu")
    row.forEach(row => {
        const tr=document.createElement("tr")

        const yazi=row.team.name
        const bolme= yazi.split(" ");
        const ilkbolum= bolme[0];
        const ikincibolum= bolme[1];

        tr.innerHTML=`
        <td>${row.position}</td>
        <td style="display: flex;"><p style="color: ${row.team.teamColors.primary}; margin-right: 0.3rem;">${ilkbolum} </p> ${ikincibolum != undefined ? `<p style="color: ${row.team.teamColors.secondary}">${ikincibolum}</p>` : ``} </td>
        <td>${row.matches}</td>
        <td>${row.wins}</td>
        <td>${row.draws}</td>
        <td>${row.losses}</td>
        <td>${row.scoreDiffFormatted}</td>
        <td>${row.scoresFor}:${row.scoresAgainst}</td>
        <td>${row.points}</td>
        `
        tbody.appendChild(tr)
    });
})


fetch("https://www.sofascore.com/api/v1/unique-tournament/8/season/61643/events/round/38")
.then(response => response.json())
.then(data =>{
    const matches = data.events.filter(event => event.roundInfo.round === 38);
    const tbody=document.querySelector("#mactablosu")
    matches.forEach(match => {

      const homeTeam = match.homeTeam?.name ?? '-';
      const awayTeam = match.awayTeam?.name ?? '-';
      const homeScore = match.homeScore?.current ?? '-';
      const awayScore = match.awayScore?.current ?? '-';


        const tr= document.createElement("tr")
        tr.innerHTML=`
        <td>${homeTeam}</td>
        <td>${awayTeam}</td>
        <td>${homeScore}</td>
        <td>${awayScore}</td>
        `
        tbody.appendChild(tr)
    });
})


