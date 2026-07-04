const known = (songId) => ({ songId });
const missing = (title, composerName, options = {}) => ({
    title,
    composerName,
    ...options
});
const mass = (
    date,
    name,
    seasonId,
    songs,
    {
        church = "Igreja de Fornelos",
        comments = ""
    } = {}
) => ({
    id: `legacy-mass-${date}`,
    date,
    name,
    seasonId,
    church,
    choir: "Coro Fornelos",
    comments: [
        "Planeamento histórico importado. Hora não indicada no guião; confirmar.",
        comments
    ].filter(Boolean).join("\n\n"),
    songs
});

const PSALM = missing("Salmo Responsorial", "Manuel Luís");
const GLORIA_SANTOS = known("repertoire-130");
const SANTO_SILVA_CARTAGENO = known("repertoire-024");
const SANTO_SANTOS = known("repertoire-026");
const SANTO_CARTAGENO = known("repertoire-022");
const CORDEIRO_SIMOES = known("repertoire-035");
const CORDEIRO_CARTAGENO = known("repertoire-032");
const CORDEIRO_MADUREIRA = known("repertoire-034");
const CORDEIRO_LUIS = known("repertoire-036");
const AGNUS_MENSCHICK = known("repertoire-031");
const GLORIA_CRISTO = missing("Glória a Vós, Cristo", "F. dos Santos");
const VI_FONTE = missing("Vi a fonte de água viva", "Az. Oliveira");
const CRISTO_CORDEIRO = missing("Cristo, nosso Cordeiro Pascal", "M. Simões");
const JA_LUZ = missing("Já a luz se levantou", "A. Cartageno");
const PASCOA_GLORIOSA = missing("Ó Páscoa Gloriosa", "F. Santos");
const SENHOR_RESSUSCITOU = missing(
    "O Senhor ressuscitou verdadeiramente",
    "A. Cartageno"
);
const ALEGRAI_MAE = missing("Alegrai-vos, Mãe de Jesus", "A. Cartageno");
const EU_VENHO_CARTAGENO = missing("Eu venho Senhor", "A. Cartageno");

export const songCorrections = [
    {
        id: "repertoire-039",
        composerName: "C. Silva"
    },
    {
        id: "repertoire-072",
        composerName: "F. da Silva"
    },
    {
        id: "repertoire-239",
        composerName: "C. Silva"
    }
];

export default [
    mass("2026-02-15", "Domingo VI do Tempo Comum | Ano A", "season-ordinary-time", {
        ENTRANCE: missing("Sede a rocha", "M. Simões"),
        PENITENTIAL: known("repertoire-001"),
        PSALM,
        ALLELUIA: known("repertoire-013"),
        OFFERTORY: known("repertoire-186"),
        HOLY: SANTO_SILVA_CARTAGENO,
        LAMB_OF_GOD: missing("Cordeiro de Deus", "F. Silva"),
        COMMUNION: known("repertoire-122"),
        THANKSGIVING: missing("Cantemos ao Senhor", "F. da Silva"),
        FINAL: known("repertoire-146")
    }),
    mass("2026-02-18", "Quarta-feira de Cinzas | Ano A", "season-lent", {
        ENTRANCE: missing("Confesso o meu pecado", "J. dos Santos"),
        PSALM,
        ALLELUIA: GLORIA_CRISTO,
        OFFERTORY: known("repertoire-038"),
        HOLY: missing("Sanctus", "Gregoriano"),
        LAMB_OF_GOD: CORDEIRO_CARTAGENO,
        COMMUNION: known("repertoire-056"),
        FINAL: known("repertoire-153")
    }, {
        comments: "Imposição das Cinzas: Perdoa ao teu povo [Az. Oliveira]."
    }),
    mass("2026-02-22", "Domingo I da Quaresma | Ano A", "season-lent", {
        ENTRANCE: missing("Ele me chamará", "J. Pedro"),
        PENITENTIAL: known("repertoire-004"),
        PSALM,
        ALLELUIA: missing("Glória a Vós, Cristo", "F. dos Santos", {
            arrangerName: "P. Cruz"
        }),
        OFFERTORY: missing("Eu sou a salvação", "C. Silva"),
        HOLY: known("repertoire-021"),
        LAMB_OF_GOD: known("repertoire-030"),
        COMMUNION: missing("Nem só de Pão vive o homem", "F. Santos"),
        FINAL: missing("Irmãos, convertei-vos", "J. Lecót")
    }),
    mass("2026-03-08", "Domingo III da Quaresma | Ano A", "season-lent", {
        ENTRANCE: missing("Eu sou a salvação", "C. Silva"),
        PENITENTIAL: known("repertoire-006"),
        PSALM,
        ALLELUIA: missing("Louvor e glória a Vós", "F. da Silva"),
        OFFERTORY: missing("Aquele que beber", "A. Cartageno"),
        HOLY: SANTO_SILVA_CARTAGENO,
        LAMB_OF_GOD: AGNUS_MENSCHICK,
        COMMUNION: known("repertoire-212"),
        THANKSGIVING: known("repertoire-257"),
        FINAL: known("repertoire-038")
    }),
    mass("2026-03-15", "Domingo IV da Quaresma | Ano A", "season-lent", {
        ENTRANCE: known("repertoire-046"),
        PENITENTIAL: known("repertoire-003"),
        PSALM,
        ALLELUIA: missing("Grandes e admiráveis", "Az. Oliveira"),
        OFFERTORY: known("repertoire-104"),
        HOLY: SANTO_SANTOS,
        LAMB_OF_GOD: CORDEIRO_MADUREIRA,
        COMMUNION: missing("Vós que me seguistes", "J. Santos"),
        THANKSGIVING: known("repertoire-178"),
        FINAL: missing("Salvé, ó Cruz", "M. Faria")
    }),
    mass("2026-03-29", "Domingo de Ramos | Ano A", "season-lent", {
        ENTRANCE: missing("Hossana nas alturas", "João Andrade Nunes"),
        PENITENTIAL: known("repertoire-002"),
        PSALM,
        ALLELUIA: missing("Louvor a Vós", "Manuel Luís"),
        OFFERTORY: missing("Aos pés da Cruz", "Henrique Faria"),
        HOLY: known("repertoire-027"),
        LAMB_OF_GOD: CORDEIRO_SIMOES,
        COMMUNION: known("repertoire-167"),
        THANKSGIVING: missing("Benedictus qui venit", "Darros"),
        FINAL: known("repertoire-137")
    }, {
        comments: "Evangelho: melodia de Joaquim dos Santos."
    }),
    mass("2026-04-02", "Quinta-feira Santa | Ano A", "season-lent", {
        ENTRANCE: missing("Toda a minha glória está na cruz", "Sousa Marques"),
        PENITENTIAL: missing("Kyrie Eleison", "Gregoriano"),
        GLORIA: GLORIA_SANTOS,
        PSALM: missing("O cálice de bênção", "R. Ramos"),
        ALLELUIA: GLORIA_CRISTO,
        OFFERTORY: known("repertoire-186"),
        HOLY: missing("Sanctus", "Gregoriano"),
        LAMB_OF_GOD: missing("Agnus Dei", "Gregoriano"),
        COMMUNION: known("repertoire-139")
    }, {
        comments: [
            "Lava-Pés: Senhor, Tu vais lavar-me os pés [M. Carneiro].",
            "Transladação do Santíssimo Sacramento: Veneremos adoremos [A. Cartageno].",
            "Deposição e incensação: Tantum Ergo [Gregoriano].",
            "Desnudação do altar: Repartiram entre si [Az. Oliveira].",
            "Final: silêncio."
        ].join("\n")
    }),
    mass("2026-04-04", "Vigília Pascal | Ano A", "season-easter", {
        GLORIA: GLORIA_SANTOS,
        ALLELUIA: missing("Aleluia", "Manuel Luís", {
            arrangerName: "Pedro Araújo"
        }),
        ASPERSION: VI_FONTE,
        OFFERTORY: JA_LUZ,
        HOLY: SANTO_SANTOS,
        LAMB_OF_GOD: AGNUS_MENSCHICK,
        COMMUNION: CRISTO_CORDEIRO,
        THANKSGIVING: ALEGRAI_MAE,
        FINAL: PASCOA_GLORIOSA
    }, {
        church: "Igreja de Gilmonde",
        comments: [
            "Liturgia da Luz: Eis a luz de Cristo — Graças a Deus.",
            "Precónio Pascal: melodia oficial.",
            "Liturgia da Palavra: salmos a definir.",
            "Liturgia Batismal: Ladainha dos Santos."
        ].join("\n")
    }),
    mass("2026-04-05", "Domingo de Páscoa | Ano A", "season-easter", {
        ENTRANCE: SENHOR_RESSUSCITOU,
        ASPERSION: VI_FONTE,
        GLORIA: GLORIA_SANTOS,
        PSALM,
        ALLELUIA: known("repertoire-020"),
        OFFERTORY: JA_LUZ,
        HOLY: SANTO_SILVA_CARTAGENO,
        LAMB_OF_GOD: AGNUS_MENSCHICK,
        COMMUNION: CRISTO_CORDEIRO,
        THANKSGIVING: known("repertoire-146"),
        FINAL: missing("Hino a Cristo Ressuscitado", "A. Cartageno")
    }, {
        comments: "Sequência Pascal: [A. Cartageno]."
    }),
    mass("2026-04-12", "Domingo II de Páscoa | Ano A", "season-easter", {
        ENTRANCE: missing("Cristo ressuscitou! Aleluia! Aleluia!", "M. Luís"),
        ASPERSION: VI_FONTE,
        GLORIA: GLORIA_SANTOS,
        PSALM,
        ALLELUIA: known("repertoire-016"),
        OFFERTORY: missing("Eis a grande Páscoa", "Az. Oliveira"),
        HOLY: SANTO_CARTAGENO,
        LAMB_OF_GOD: CORDEIRO_LUIS,
        COMMUNION: missing("Sempre que comemos o pão", "F. dos Santos"),
        THANKSGIVING: known("repertoire-154"),
        FINAL: PASCOA_GLORIOSA
    }),
    mass("2026-04-19", "Domingo III de Páscoa | Ano A", "season-easter", {
        ENTRANCE: known("repertoire-068"),
        GLORIA: GLORIA_SANTOS,
        PSALM,
        ALLELUIA: known("repertoire-011"),
        OFFERTORY: missing("O Hino da alegria", "M. Faria"),
        HOLY: SANTO_CARTAGENO,
        LAMB_OF_GOD: CORDEIRO_SIMOES,
        COMMUNION: missing("Os discípulos reconheceram", "F. Silva"),
        FINAL: SENHOR_RESSUSCITOU
    }),
    mass("2026-05-03", "Domingo V de Páscoa | Ano A", "season-easter", {
        ENTRANCE: missing("Cantai ao Senhor um cântico novo", "F. Silva"),
        GLORIA: GLORIA_SANTOS,
        PSALM,
        ALLELUIA: known("repertoire-019"),
        OFFERTORY: missing("Ressuscitou o Bom Pastor", "J. Santos"),
        HOLY: SANTO_SANTOS,
        LAMB_OF_GOD: CORDEIRO_CARTAGENO,
        COMMUNION: known("repertoire-198"),
        THANKSGIVING: known("repertoire-239"),
        FINAL: ALEGRAI_MAE
    }, {
        comments: "Cântico adicional: Avé Maria, cheia de graça [M. Silva]."
    }),
    mass("2026-05-17", "Ascensão do Senhor | Ano A", "season-easter", {
        ENTRANCE: known("repertoire-045"),
        GLORIA: GLORIA_SANTOS,
        PSALM,
        ALLELUIA: known("repertoire-014"),
        OFFERTORY: known("repertoire-217"),
        HOLY: SANTO_SILVA_CARTAGENO,
        LAMB_OF_GOD: AGNUS_MENSCHICK,
        COMMUNION: known("repertoire-110"),
        THANKSGIVING: missing("Enviai, Senhor, o vosso Espírito", "Carlos Silva"),
        FINAL: known("repertoire-208")
    }),
    mass("2026-05-22", "Procissão e Eucaristia | Ano A", "season-easter", {
        ENTRANCE: known("repertoire-258"),
        PENITENTIAL: known("repertoire-002"),
        PSALM,
        ALLELUIA: known("repertoire-015"),
        OFFERTORY: known("repertoire-057"),
        HOLY: SANTO_SILVA_CARTAGENO,
        LAMB_OF_GOD: CORDEIRO_MADUREIRA,
        COMMUNION: known("repertoire-100"),
        THANKSGIVING: known("repertoire-164"),
        FINAL: known("repertoire-059")
    }, {
        comments: [
            "Cânticos do Terço:",
            "Nós Te cantamos e aclamamos [M. Borda].",
            "Senhora, um dia descestes [C. Silva].",
            "Senhora nós Vos louvamos [M. Faria]."
        ].join("\n")
    }),
    mass("2026-05-31", "Santíssima Trindade | Ano A", "season-ordinary-time", {
        ENTRANCE: known("repertoire-052"),
        GLORIA: known("repertoire-129"),
        PSALM,
        ALLELUIA: known("repertoire-017"),
        OFFERTORY: known("repertoire-042"),
        HOLY: known("repertoire-028"),
        LAMB_OF_GOD: CORDEIRO_LUIS,
        COMMUNION: known("repertoire-200"),
        THANKSGIVING: known("repertoire-132"),
        FINAL: known("repertoire-074")
    }),
    mass("2026-06-04", "Santíssimo Corpo e Sangue de Cristo | Ano A", "season-ordinary-time", {
        ENTRANCE: known("repertoire-177"),
        GLORIA: known("repertoire-129"),
        PSALM,
        ALLELUIA: known("repertoire-018"),
        OFFERTORY: known("repertoire-050"),
        HOLY: SANTO_SANTOS,
        LAMB_OF_GOD: CORDEIRO_SIMOES,
        COMMUNION: known("repertoire-065"),
        THANKSGIVING: known("repertoire-220"),
        FINAL: known("repertoire-133")
    }),
    mass("2026-06-07", "Domingo X do Tempo Comum | Ano A", "season-ordinary-time", {
        ENTRANCE: known("repertoire-203"),
        PENITENTIAL: known("repertoire-005"),
        PSALM,
        ALLELUIA: known("repertoire-011"),
        OFFERTORY: known("repertoire-060"),
        HOLY: SANTO_CARTAGENO,
        LAMB_OF_GOD: CORDEIRO_SIMOES,
        COMMUNION: known("repertoire-139"),
        FINAL: known("repertoire-094")
    }),
    mass("2026-06-21", "Domingo XII do Tempo Comum | Ano A", "season-ordinary-time", {
        ENTRANCE: known("repertoire-095"),
        PENITENTIAL: known("repertoire-001"),
        PSALM,
        ALLELUIA: known("repertoire-012"),
        OFFERTORY: known("repertoire-162"),
        HOLY: known("repertoire-027"),
        LAMB_OF_GOD: CORDEIRO_CARTAGENO,
        COMMUNION: missing("O Cordeiro de Deus é o nosso Pastor", "Carlos Silva"),
        FINAL: known("repertoire-216")
    }),
    mass("2026-06-26", "Sexta-feira XII do Tempo Comum | Ano A", "season-ordinary-time", {
        ENTRANCE: EU_VENHO_CARTAGENO,
        PENITENTIAL: known("repertoire-007"),
        PSALM,
        ALLELUIA: known("repertoire-013"),
        OFFERTORY: known("repertoire-155"),
        HOLY: known("repertoire-028"),
        LAMB_OF_GOD: CORDEIRO_MADUREIRA,
        COMMUNION: known("repertoire-145"),
        THANKSGIVING: known("repertoire-185"),
        FINAL: known("repertoire-072")
    }, {
        comments: "Cântico opcional: O Pão de Deus [J. Santos]."
    }),
    mass("2026-06-28", "Domingo XIII do Tempo Comum | Ano A", "season-ordinary-time", {
        ENTRANCE: known("repertoire-161"),
        GLORIA: known("repertoire-129"),
        PSALM,
        ALLELUIA: known("repertoire-009"),
        OFFERTORY: known("repertoire-199"),
        HOLY: known("repertoire-021"),
        LAMB_OF_GOD: known("repertoire-030"),
        COMMUNION: missing("O Corpo de Jesus é alimento", "F. da Silva"),
        THANKSGIVING: known("repertoire-257"),
        FINAL: known("repertoire-148")
    }),
    mass("2026-07-12", "Domingo XV do Tempo Comum | Ano A", "season-ordinary-time", {
        ENTRANCE: EU_VENHO_CARTAGENO,
        PENITENTIAL: known("repertoire-002"),
        PSALM,
        ALLELUIA: known("repertoire-020"),
        OFFERTORY: known("repertoire-123"),
        HOLY: known("repertoire-029"),
        LAMB_OF_GOD: CORDEIRO_SIMOES,
        COMMUNION: known("repertoire-039"),
        FINAL: known("repertoire-089")
    })
];
