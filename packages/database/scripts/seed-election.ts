/**
 * Demo seçim gecesi verisi — mockup’lardaki sayılar
 */
import { prisma } from "../src/index.ts";
import { allocateDhondt } from "@yenihaber/shared";

async function main() {
  await prisma.electionSeat.deleteMany();
  await prisma.electionResult.deleteMany();
  await prisma.electionCandidate.deleteMany();
  await prisma.electionRace.deleteMany();
  await prisma.electionParty.deleteMany();
  await prisma.electionAlliance.deleteMany();
  await prisma.electionRegion.deleteMany();
  await prisma.election.deleteMany({ where: { slug: "demo-2024" } });

  const election = await prisma.election.create({
    data: {
      name: "31 Mart Yerel + Genel Demo",
      slug: "demo-2024",
      kind: "genel",
      status: "live",
      electionAt: new Date(),
    },
  });

  const ulke = await prisma.electionRegion.create({
    data: {
      electionId: election.id,
      level: "ulke",
      name: "Türkiye",
      slug: "turkiye",
      ballotTotal: 200000,
      ballotOpen: 188200,
      source: "ajans",
      sourceUpdatedAt: new Date(Date.now() - 13 * 60_000),
      sortOrder: 0,
    },
  });

  const duzce = await prisma.electionRegion.create({
    data: {
      electionId: election.id,
      parentId: ulke.id,
      level: "il",
      name: "Düzce",
      slug: "duzce",
      ballotTotal: 1910,
      ballotOpen: 1284,
      source: "manuel",
      sourceUpdatedAt: new Date(),
      sortOrder: 1,
    },
  });

  const partiesData = [
    { name: "A partisi", shortName: "A", color: "#2563EB", alliance: "cumhur" },
    { name: "B partisi", shortName: "B", color: "#EF4444", alliance: "millet" },
    { name: "C partisi", shortName: "C", color: "#16A34A", alliance: "millet" },
    { name: "D partisi", shortName: "D", color: "#F59E0B", alliance: "cumhur" },
    { name: "E partisi", shortName: "E", color: "#8B5CF6", alliance: "emek" },
    { name: "F partisi", shortName: "F", color: "#EC4899", alliance: "emek" },
    { name: "G partisi", shortName: "G", color: "#EA580C", alliance: null },
    { name: "Bağımsız", shortName: "Bağ.", color: "#64748B", alliance: null },
  ];

  const allCumhur = await prisma.electionAlliance.create({
    data: {
      electionId: election.id,
      name: "Cumhur İttifakı",
      color: "#EA580C",
    },
  });
  const allMillet = await prisma.electionAlliance.create({
    data: {
      electionId: election.id,
      name: "Millet İttifakı",
      color: "#DC2626",
    },
  });
  const allEmek = await prisma.electionAlliance.create({
    data: {
      electionId: election.id,
      name: "Emek ve Özgürlük",
      color: "#7C3AED",
    },
  });
  const allianceMap: Record<string, string> = {
    cumhur: allCumhur.id,
    millet: allMillet.id,
    emek: allEmek.id,
  };

  const parties = [];
  for (let i = 0; i < partiesData.length; i++) {
    const p = partiesData[i]!;
    parties.push(
      await prisma.electionParty.create({
        data: {
          electionId: election.id,
          name: p.name,
          shortName: p.shortName,
          color: p.color,
          sortOrder: i,
          allianceId: p.alliance ? allianceMap[p.alliance] : null,
        },
      }),
    );
  }

  const [pA, pB, pC, pD, pE, pF, pG, pBag] = parties;

  // Başkanlık
  const raceBaskan = await prisma.electionRace.create({
    data: {
      electionId: election.id,
      regionId: duzce.id,
      type: "baskanlik",
      name: "Düzce belediye başkanlığı",
      isFeatured: true,
      sortOrder: 0,
      status: "live",
    },
  });

  const baskanCands = [
    { name: "A. Yılmaz", initials: "AY", partyId: pA!.id, votes: 31940 },
    { name: "M. Demir", initials: "MD", partyId: pB!.id, votes: 29690 },
    { name: "S. Kaya", initials: "SK", partyId: pC!.id, votes: 11570 },
    { name: "H. Aydın", initials: "HA", partyId: pD!.id, votes: 8020 },
    { name: "E. Şahin", initials: "EŞ", partyId: pE!.id, votes: 4760 },
    { name: "F. Çelik", initials: "FÇ", partyId: pF!.id, votes: 3640 },
    { name: "K. Öztürk", initials: "KÖ", partyId: pBag!.id, votes: 2240 },
    { name: "B. Arslan", initials: "BA", partyId: pG!.id, votes: 1490 },
  ];

  for (let i = 0; i < baskanCands.length; i++) {
    const row = baskanCands[i]!;
    const cand = await prisma.electionCandidate.create({
      data: {
        raceId: raceBaskan.id,
        partyId: row.partyId,
        name: row.name,
        initials: row.initials,
        listOrder: i + 1,
        showInStrip: i < 5,
        stripPin: i < 5 ? i + 1 : null,
      },
    });
    await prisma.electionResult.create({
      data: {
        raceId: raceBaskan.id,
        regionId: duzce.id,
        candidateId: cand.id,
        votes: row.votes,
        source: "manuel",
      },
    });
  }

  // Meclis
  const raceMeclis = await prisma.electionRace.create({
    data: {
      electionId: election.id,
      regionId: duzce.id,
      type: "meclis",
      name: "Belediye meclisi",
      seatCount: 31,
      sortOrder: 1,
      note: "A partisi 13 koltukta kaldı — tek başına çoğunluk yok, 3 koltuk eksik.",
      noteTone: "warn",
    },
  });

  const meclisVotes = [
    { party: pA!, votes: 32750 },
    { party: pB!, votes: 28360 },
    { party: pC!, votes: 12310 },
    { party: pD!, votes: 9135 },
    { party: pE!, votes: 5030 },
    { party: pBag!, votes: 5690, name: "Diğer" },
  ];

  for (let i = 0; i < meclisVotes.length; i++) {
    const row = meclisVotes[i]!;
    const cand = await prisma.electionCandidate.create({
      data: {
        raceId: raceMeclis.id,
        partyId: row.party.id,
        name: "name" in row && row.name ? row.name : row.party.name,
        initials: row.party.shortName.slice(0, 2),
        listOrder: i + 1,
      },
    });
    await prisma.electionResult.create({
      data: {
        raceId: raceMeclis.id,
        regionId: duzce.id,
        candidateId: cand.id,
        votes: row.votes,
      },
    });
  }

  const meclisAlloc = allocateDhondt(
    meclisVotes.map((m) => ({ id: m.party.id, votes: m.votes })),
    31,
  );
  for (const a of meclisAlloc) {
    await prisma.electionSeat.create({
      data: {
        raceId: raceMeclis.id,
        partyId: a.id,
        seatCount: a.seats,
        voteShare: a.voteShare,
        confirmed: true,
      },
    });
  }

  // Cumhurbaşkanlığı — ülke + Düzce
  const raceCb = await prisma.electionRace.create({
    data: {
      electionId: election.id,
      regionId: ulke.id,
      type: "cumhurbaskanligi",
      name: "Cumhurbaşkanlığı",
      round: 1,
      sortOrder: 2,
      note: "Hiçbir aday %50'yi geçemedi — seçim ikinci tura kalıyor.",
      noteTone: "warn",
    },
  });

  const cbCands = [
    { name: "A. Yılmaz", initials: "AY", partyId: pA!.id, ulke: 478000, duzce: 52100 },
    { name: "M. Demir", initials: "MD", partyId: pB!.id, ulke: 442000, duzce: 40600 },
    { name: "S. Kaya", initials: "SK", partyId: pC!.id, ulke: 54000, duzce: 4900 },
    { name: "H. Aydın", initials: "HA", partyId: pD!.id, ulke: 26000, duzce: 2400 },
  ];

  for (let i = 0; i < cbCands.length; i++) {
    const row = cbCands[i]!;
    const cand = await prisma.electionCandidate.create({
      data: {
        raceId: raceCb.id,
        partyId: row.partyId,
        name: row.name,
        initials: row.initials,
        listOrder: i + 1,
      },
    });
    await prisma.electionResult.create({
      data: {
        raceId: raceCb.id,
        regionId: ulke.id,
        candidateId: cand.id,
        votes: row.ulke,
        source: "ajans",
      },
    });
    await prisma.electionResult.create({
      data: {
        raceId: raceCb.id,
        regionId: duzce.id,
        candidateId: cand.id,
        votes: row.duzce,
        source: "manuel",
      },
    });
  }

  await prisma.electionRegion.update({
    where: { id: duzce.id },
    data: {
      /* Düzce CB sandık */
    },
  });
  // Düzce için ayrı ballot: CB yarışında bölge aynı duzce — sandık %97,6
  // (başkanlık 67,2). İki farklı race aynı region paylaşıyor — CB için
  // ülke bölgesi sandık %94,1. Düzce CB için ballot'u ayrı tutamayız tek region'da;
  // pratikte CB karşılaştırma Düzce sonuçlarını candidate votes'tan alır.
  // Sandık etiketi için duzce ballot'u başkanlıkta 67.2; CB Düzce satırında
  // ayrı gösterim için ikinci region kopyası:
  const duzceCb = await prisma.electionRegion.create({
    data: {
      electionId: election.id,
      parentId: ulke.id,
      level: "il",
      name: "Düzce",
      slug: "duzce-cb",
      ballotTotal: 10000,
      ballotOpen: 9760,
      source: "manuel",
      sourceUpdatedAt: new Date(),
      sortOrder: 2,
    },
  });

  // Move Düzce CB results to duzceCb region
  await prisma.electionResult.deleteMany({
    where: { raceId: raceCb.id, regionId: duzce.id },
  });
  for (let i = 0; i < cbCands.length; i++) {
    const row = cbCands[i]!;
    const cand = await prisma.electionCandidate.findFirst({
      where: { raceId: raceCb.id, name: row.name },
    });
    if (!cand) continue;
    await prisma.electionResult.create({
      data: {
        raceId: raceCb.id,
        regionId: duzceCb.id,
        candidateId: cand.id,
        votes: row.duzce,
        source: "manuel",
      },
    });
  }

  // Milletvekili
  const raceMv = await prisma.electionRace.create({
    data: {
      electionId: election.id,
      regionId: duzce.id,
      type: "milletvekili",
      name: "Düzce milletvekilleri",
      seatCount: 3,
      sortOrder: 3,
      note: null,
    },
  });

  const mvPartyVotes = [
    { party: pA!, votes: 44200 },
    { party: pB!, votes: 38600 },
    { party: pC!, votes: 9200 },
    { party: pD!, votes: 5100 },
    { party: pBag!, votes: 2900, label: "Diğer" },
  ];

  for (let i = 0; i < mvPartyVotes.length; i++) {
    const row = mvPartyVotes[i]!;
    const cand = await prisma.electionCandidate.create({
      data: {
        raceId: raceMv.id,
        partyId: row.party.id,
        name: "label" in row && row.label ? row.label : row.party.name,
        listOrder: i + 1,
      },
    });
    await prisma.electionResult.create({
      data: {
        raceId: raceMv.id,
        regionId: duzce.id,
        candidateId: cand.id,
        votes: row.votes,
      },
    });
  }

  const mvAlloc = allocateDhondt(
    mvPartyVotes.map((m) => ({ id: m.party.id, votes: m.votes })),
    3,
  );
  for (const a of mvAlloc) {
    await prisma.electionSeat.create({
      data: {
        raceId: raceMv.id,
        partyId: a.id,
        seatCount: a.seats,
        voteShare: a.voteShare,
        confirmed: true,
      },
    });
  }

  // Seçilen vekiller (liste sırası)
  await prisma.electionCandidate.createMany({
    data: [
      {
        raceId: raceMv.id,
        partyId: pA!.id,
        name: "Ç. Aksoy",
        initials: "ÇA",
        listOrder: 100,
      },
      {
        raceId: raceMv.id,
        partyId: pA!.id,
        name: "N. Polat",
        initials: "NP",
        listOrder: 101,
      },
      {
        raceId: raceMv.id,
        partyId: pB!.id,
        name: "R. Erdem",
        initials: "RE",
        listOrder: 102,
      },
    ],
  });

  // Strip cache
  await prisma.setting.upsert({
    where: { key: "election.active_id" },
    create: {
      key: "election.active_id",
      value: election.id,
      groupName: "content",
    },
    update: { value: election.id, groupName: "content" },
  });

  console.log(
    JSON.stringify({
      electionId: election.id,
      slug: election.slug,
      races: {
        baskanlik: raceBaskan.id,
        meclis: raceMeclis.id,
        cb: raceCb.id,
        mv: raceMv.id,
      },
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
