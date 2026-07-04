const UNKNOWN = "Compositor desconhecido";
const ADVENT = "tag-season-advent";
const CHRISTMAS = "tag-season-christmas";
const LENT = "tag-season-lent";
const MARIAN = "tag-category-marian";
const BAPTISM = "tag-context-baptism";
const CORPUS_CHRISTI = "tag-occasion-saints";

function song(
    number,
    title,
    composerName = UNKNOWN,
    songTypes = "OTHER",
    {
        arrangerName = null,
        harmonizerName = null,
        tagIds = []
    } = {}
) {
    return {
        id: `repertoire-${String(number).padStart(3, "0")}`,
        title,
        composerName,
        arrangerName,
        harmonizerName,
        songTypes: Array.isArray(songTypes) ? songTypes : [songTypes],
        tagIds
    };
}

export default [
    // Capa 8
    song(84, "Cristo hoje nos chama", "Michel Wackenheim", "ENTRANCE"),
    song(85, "Cristo hoje, Cristo ontem", "J. Lecót", "FINAL"),
    song(86, "Cristo vence", "A. Kunc", "FINAL"),
    song(87, "Crucifixus", "João Andrade Nunes"),
    song(88, "Dai a paz, Senhor", "M. Faria", "FINAL"),
    song(89, "Dai graças ao Senhor", "F. Santos", "FINAL"),
    song(90, "Dai graças ao Senhor", "Ferreira dos Santos", "FINAL"),
    song(91, "Deixamos Aqui Senhor", "António Cartageno", "OFFERTORY", {
        tagIds: [ADVENT]
    }),
    song(92, "Desce o orvalho sobre a terra", "Manuel Simões", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(93, "Deus caritas est", "Henryk Jan Botor/A. Cartageno", "OFFERTORY"),
    song(94, "Deus é Pai, Deus é Amor", "F. Silva", "FINAL"),
    song(95, "Deus vive na sua morada santa", "F. dos Santos", "ENTRANCE"),
    song(96, "Ditosos os que Te louvam sempre", "F. Santos", ["COMMUNION", "FINAL"]),
    song(97, "Diz o Senhor: Ide e ensinai", "A. Cartageno", "FINAL"),
    song(98, "Dou-vos um mandamento novo", "J. Fernandes da Silva", ["OFFERTORY", "COMMUNION"]),
    song(99, "É Jesus quem nos convida", UNKNOWN, "COMMUNION"),

    // Capa 9
    song(100, "É celebrada a vossa glória", "F. Santos", "COMMUNION"),
    song(101, "Eis a escrava do Senhor", "C. Silva", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(102, "Eis-me aqui", "Marco Frisina", "ENTRANCE"),
    song(103, "Em redor do teu altar", "Miguel Carneiro", "OFFERTORY"),
    song(104, "Em Vós, Senhor, está a fonte da vida", "Az. Oliveira (nº 67)", "OFFERTORY"),
    song(105, "Esta é a geração", "Az. Oliveira"),
    song(106, "Este é aquele", "C. Silva", "OFFERTORY"),
    song(107, "Este é o meu filho muito amado", "J. Geada", "COMMUNION"),
    song(108, "Eu confio, Senhor, na vossa bondade", "F. Silva", "ENTRANCE"),
    song(109, "Eu estou à porta e chamo", "Fernandes da Silva", "COMMUNION"),
    song(110, "Eu estou sempre convosco", "C. Silva", "COMMUNION"),
    song(111, "Eu sou o caminho", "Manuel Luís", "OFFERTORY", {
        arrangerName: "A. Cartageno"
    }),
    song(112, "Eu sou o Pão vivo", "Carlos Silva", "COMMUNION"),
    song(113, "Eu venho, Senhor", "Az. Oliveira", "ENTRANCE"),
    song(114, "Eu venho, Senhor, à vossa presença", "A. Cartageno", "ENTRANCE"),

    // Capa 10
    song(115, "Eu vi a cidade santa", "F. Santos", "ENTRANCE"),
    song(116, "Eu vim para que tenham vida", "F. Silva", "COMMUNION"),
    song(117, "Exultai de alegria e cantai", "F. Silva", "FINAL"),
    song(118, "Exultai de alegria, cantai hinos", "F. Silva", "FINAL"),
    song(119, "Exultemos, exultemos de alegria", "A. Cartageno", "COMMUNION"),
    song(120, "Feliz o povo que o Senhor escolheu (salmo)", "Manuel Luís", "RESPONSORIAL_PSALM", {
        arrangerName: "A. Cartageno"
    }),
    song(121, "Felizes as entranhas", UNKNOWN, "OTHER", {
        tagIds: [MARIAN]
    }),
    song(122, "Felizes os convidados", "Carlos Silva", "COMMUNION"),
    song(123, "Felizes os que habitam na vossa casa", "M. Valença", "OFFERTORY"),
    song(124, "Felizes são os que ouvem a palavra de Deus", "Ricardo Luís Campos", "COMMUNION"),
    song(125, "Fez-vos Cristo luz do mundo", "F. da Silva", "OFFERTORY"),
    song(126, "Fonte de Água Viva", "António Cartageno", "OFFERTORY"),

    // Capa 11
    song(127, "Formamos um só corpo", "C. Silva", "COMMUNION"),
    song(128, "Glória", "Az. Oliveira", "GLORIA"),
    song(129, "Glória a Deus", "A. Cartageno", "GLORIA"),
    song(130, "Glória a Deus nas alturas", "Ferreira dos Santos", "GLORIA"),
    song(131, "Glória a Ti glória Senhor", "D. Julien", "FINAL"),
    song(132, "Glória ao pai que nos criou", "Carlos Silva", "OFFERTORY"),
    song(133, "Glória ao Senhor pelos Séculos", "António Cartageno", "FINAL"),
    song(134, "Glória da humanidade", "A. Cartageno", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(135, "Gloriosa Mãe de Deus", "Miguel Carneiro", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(136, "Hino à Senhora da Franqueira", "P. Lima Torres", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(137, "Hosanna ao Filho de David", "C. Silva"),
    song(138, "Iremos com alegria", "M. Borda", "ENTRANCE"),
    song(139, "Isto é o meu corpo", "C. Silva", "COMMUNION"),

    // Capa 12
    song(140, "Jerusalém do alto", "M. Faria", "FINAL"),
    song(141, "Jesus Cristo, ó porta do Reino", "F. Santos"),
    song(142, "Jesus Cristo, ontem e hoje", "A. Cartageno", "COMMUNION"),
    song(143, "Jesus é a Palavra de Deus", "Az. Oliveira", "OFFERTORY"),
    song(144, "Jesus tomou consigo", "C. Silva", "OFFERTORY"),
    song(145, "Jesus, és o alimento", "C. Silva", "COMMUNION"),
    song(146, "Jubilate Deo", "J. P. Lécot", "FINAL"),
    song(147, "Laudate, omnes gentes", "Taizé", "COMMUNION"),
    song(148, "Louvai, louvai o Senhor (nº 85)", "F. da Silva", ["ENTRANCE", "FINAL"]),
    song(149, "Magnificat", "B. Terreiro", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(150, "Maria, mãe do Senhor", "Az. Oliveira", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(151, "Mestra do Anúncio, Profecia do Amor", "José Joaquim S. Ribeiro", "OTHER", {
        tagIds: [MARIAN]
    }),

    // Capa 13
    song(152, "Minha alma exulta", "Fernandes da Silva", "FINAL"),
    song(153, "Misericordes sicut Pater", "Paul Inwood", "FINAL"),
    song(154, "Misericordias Domini", "Henryk Botor", "FINAL"),
    song(155, "Na Hóstia sobre a patena", "Benjamin Salgado", "OFFERTORY"),
    song(156, "Na simplicidade", "Az. Oliveira"),
    song(157, "Nada te turbe", "Taizé", "COMMUNION"),
    song(158, "Nasce na paz a joia verdadeira", "Marco Frisina", "COMMUNION"),
    song(159, "Nós conhecemos", "Samuel Pinto"),
    song(160, "Nós somos as pedras vivas", "M. Luís", "COMMUNION"),
    song(161, "Nós somos as pedras vivas", "F. Santos", "ENTRANCE"),
    song(162, "Nós somos o povo de Deus", "Frederico de Freitas", "OFFERTORY"),
    song(163, "Nós Te cantamos e aclamamos", "M. Borda", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(164, "Nós Vos cantamos", "Teodoro de Sousa", "OTHER", {
        tagIds: [MARIAN]
    }),

    // Capa 14
    song(165, "O amor de Deus repousa", "M. Luís", "FINAL"),
    song(166, "O Bom pastor", UNKNOWN, "COMMUNION"),
    song(167, "O Cálice da benção", "F. da Silva", "OFFERTORY"),
    song(168, "O Cálice de bênção", "M. Borda", "OFFERTORY"),
    song(169, "O Cordeiro de Deus", "C. Silva", "COMMUNION"),
    song(170, "O Cordeiro que foi imolado", "J. Santos", "ENTRANCE"),
    song(171, "O Corpo de Jesus é alimento", "A. Cartageno", "OFFERTORY"),
    song(172, "O Espírito de Deus enche o universo", "M. Simões", "FINAL"),
    song(173, "O Espírito de Deus repousou sobre mim", "Az. Oliveira", "OFFERTORY"),
    song(174, "O Espírito do Senhor", "M. Simões", "FINAL"),
    song(175, "O Filho do Homem", "F. dos Santos", "COMMUNION"),
    song(176, "O Pão de Deus", "J. Santos", "COMMUNION"),

    // Capa 15
    song(177, "O Senhor alimentou-nos", "C. Silva", "COMMUNION"),
    song(178, "O Senhor salvou-me", "Carlos Silva", "FINAL"),
    song(179, "O Senhor vela sobre os seus fiéis", "João Andrade Nunes", "COMMUNION"),
    song(180, "Ó Senhor, dá-me o teu pão", "H. Faria", "COMMUNION"),
    song(181, "Ó Senhor, eu creio", "H. Faria", "COMMUNION"),
    song(182, "O templo de Deus é santo", "C. Silva", "OFFERTORY"),
    song(183, "O trigo que Deus semeou", "C. Silva", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(184, "Ó Virgem pura e bela", "P. Manuel Rodrigues de Azevedo", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(185, "Oh verdadeiro Corpo do Senhor", "C. Silva", "COMMUNION"),
    song(186, "Onde há caridade e amor", "B. Ramos", "OFFERTORY"),
    song(187, "Onde se reúnem dois ou três", "A. Oliveira", "OFFERTORY"),
    song(188, "Os dons que Vos trazemos com fervor", "F. da Silva", "OFFERTORY"),
    song(189, "Os povos Vos louvem", "António Cartageno", "FINAL"),
    song(190, "Os povos, os povos proclamam", "A. Cartageno", "ENTRANCE"),
    song(191, "Ouviu-se uma voz", "Acílio Mendes", "ENTRANCE"),
    song(192, "Ouviu-se uma voz", "Vítor Pereira", "ENTRANCE"),

    // Capa 16
    song(193, "Pão dos Anjos, pão do Céu", "F. Silva", "OFFERTORY"),
    song(194, "Pedimos, Senhor o perdão", "A. Cartageno", "PENITENTIAL_ACT", {
        tagIds: [LENT]
    }),
    song(195, "Percorrei os caminhos do mundo", "F. Silva", ["COMMUNION", "FINAL"]),
    song(196, "Perdoa ao teu Povo", "Az. Oliveira", "PENITENTIAL_ACT", {
        tagIds: [LENT]
    }),
    song(197, "Peregrinos de esperança (Hino Jubileu)", "Francesco Meneghello", "FINAL"),
    song(198, "Permanecei em Mim", "A. Cartageno", "COMMUNION"),
    song(199, "Por vossa imensa bondade", "A. Cartageno", "OFFERTORY"),
    song(200, "Porque somos filhos de Deus", "A. Cartageno", "COMMUNION", {
        arrangerName: "Fernando Melro"
    }),
    song(201, "Portugal em pequenino", "Benjamin Salgado", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(202, "Povo das Bem-aventuranças", "Frei Acílio Mendes"),
    song(203, "Povo de Deus, Cidade do Emanuel", "Jean-Paul Lécot", "ENTRANCE"),
    song(204, "Povo de Reis", "Lucien Deiss", "ENTRANCE"),
    song(205, "Povo por Deus reunido", "H. Faria", "ENTRANCE"),
    song(206, "Povo sacerdotal", "Ac. Mendes"),
    song(207, "Povo teu somos, ó Senhor", UNKNOWN, "FINAL"),
    song(208, "Povos, batei palmas", "C. Silva", "FINAL"),
    song(209, "Proclamai entre as nações", "A. Cartageno", "FINAL"),

    // Capa 17
    song(210, "Quem do céu graças pretende", "M. Alaio"),
    song(211, "Que graça, Senhor, Que bendita luz!", "M. Faria"),
    song(212, "Quem beber da água", "Az. Oliveira", ["OFFERTORY", "COMMUNION"]),
    song(213, "Quem disser: “Eu amo a Deus”", "F. Silva", ["OFFERTORY", "COMMUNION"]),
    song(214, "Quem fizer a vontade de meu Pai", "C. Silva", ["OFFERTORY", "COMMUNION"]),
    song(215, "Quero bendizer-Vos", "A. Cartageno", ["OFFERTORY", "FINAL"]),
    song(216, "Quero cantar o vosso nome", "A. Cartageno", "FINAL"),
    song(217, "Reinos da terra, cantai a Deus", "F. Silva", "FINAL"),
    song(218, "S. Salvador de Fornelos", "F. Silva", "FINAL"),
    song(219, "Saboreai como é bom", "J. Santos", "COMMUNION"),
    song(220, "Saciastes o vosso povo", "F. Silva", "COMMUNION"),
    song(221, "Salvai, Senhor, o vosso povo", "J. Santos", "ENTRANCE"),
    song(222, "Salve Estrela", "A. Cartageno", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(223, "Salve ó Virgem Maria", UNKNOWN, "OTHER", {
        tagIds: [MARIAN]
    }),
    song(224, "Salvé, ó Virgem Maria", "C. Silva", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(225, "Salve, Salve, Pastorinhos", "A. Cartageno", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(226, "Salve, Virgem Mãe de Deus", "F. Silva", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(227, "Santíssima Trindade", UNKNOWN),

    // Capa 18
    song(228, "Se cumprirdes", "C. Silva", "COMMUNION"),
    song(229, "Se não comerdes a minha carne", "F. Silva", "COMMUNION"),
    song(230, "Se vos amardes", "F. Silva", "COMMUNION"),
    song(231, "Seguir-Te-ei", "Marco Frisina", "OFFERTORY"),
    song(232, "Senhor, eu creio que sois Cristo", "F. Silva", "COMMUNION"),
    song(233, "Senhor, fica connosco", "M. Carneiro (nº 94)", "FINAL"),
    song(234, "Senhor, nós Te pedimos"),
    song(235, "Senhor, quem habitará?", "Nuno O.", "OFFERTORY"),
    song(236, "Senhor, trazei-nos a paz", "Az. Oliveira", "FINAL"),
    song(237, "Senhor, Tu és a luz", "Azevedo Oliveira", ["OFFERTORY", "FINAL"]),
    song(238, "Senhor, Tu és o pão Entregue por amor", "G. Kirby", "COMMUNION"),
    song(239, "Senhor, Vós sois o Caminho", UNKNOWN, ["COMMUNION", "FINAL"]),
    song(240, "Senhora do manto lindo", "H. Faria", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(241, "Senhora, um dia descestes", "C. Silva", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(242, "Stabat Mater", "Zoltan Kodaly", "OTHER", {
        tagIds: [MARIAN]
    }),

    // Capa 19
    song(243, "Somos a Igreja de Cristo", "M. Faria", "ENTRANCE"),
    song(244, "Somos testemunhas de Cristo", "A. Oliveira", "FINAL"),
    song(245, "Somos todos convidados", "F. Silva", "COMMUNION"),
    song(246, "Subam até Vós", "M. Luís", "OFFERTORY"),
    song(247, "Tantum Ergo", "Gregoriano", "OTHER", {
        tagIds: [CORPUS_CHRISTI]
    }),
    song(248, "Toda a nossa Glória", "M. Luís", "OTHER", {
        arrangerName: "A. Cartageno",
        tagIds: [LENT]
    }),
    song(249, "Toda a terra Vos adore", "Carlos Silva", "ENTRANCE"),
    song(250, "Todo aquele que vive e crê em mim", "Fernando C. Lapa", "COMMUNION"),
    song(251, "Tomai e comei", "F. Silva", "COMMUNION"),
    song(252, "Tomai, Senhor, e recebei", "J. Santos (nº 70)", "OFFERTORY"),
    song(253, "Totus Tuus", "Marco Frisina", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(254, "Trazemos ao teu altar", "F. Silva", "OFFERTORY"),
    song(255, "Tu és a honra do nosso povo", "M. Luís", "OTHER", {
        tagIds: [MARIAN]
    }),
    song(256, "Tudo o que me pedires", "C. Silva", ["OFFERTORY", "COMMUNION"]),
    song(257, "Tudo posso", "C. Silva", ["OFFERTORY", "COMMUNION"], {
        arrangerName: "A. Cartageno"
    }),
    song(258, "Vamos confiantes ao trono da graça", "A. Cartageno", "ENTRANCE", {
        tagIds: [MARIAN]
    }),
    song(259, "Vamos proclamar pelo mundo inteiro", "F. Silva", "FINAL"),
    song(260, "Veneremos adoremos", "A. Cartageno", "OTHER", {
        tagIds: [CORPUS_CHRISTI]
    }),
    song(261, "Viemos com alegria", "C. Silva", "ENTRANCE"),

    // Capa 20
    song(262, "Vinde à presença do Senhor", "Sousa Marques", "ENTRANCE"),
    song(263, "Vinde comer do meu Pão", UNKNOWN, "COMMUNION"),
    song(264, "Vinde, benditos de meu Pai", "A. Cartageno", "OFFERTORY"),
    song(265, "Vinde, Espírito Divino", "Manuel F. Borda", "OFFERTORY"),
    song(266, "Vós que fostes batizados", "F. Santos", "OFFERTORY", {
        tagIds: [BAPTISM]
    }),
    song(267, "Vós sereis meus amigos", "P. Manuel Luís", ["OFFERTORY", "COMMUNION"]),
    song(268, "Vós sois o caminho", "J. Santos", "OFFERTORY"),

    // Advento
    song(269, "A Virgem conceberá", "Pe. Ferreira dos Santos", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(270, "Abri as portas", "C. Silva", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(271, "Abri as portas", "C. Silva (NOVO)", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(272, "Alegrai-vos no Senhor", "F. Fernandes", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(273, "Eis que uma Virgem", "B. Sousa", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(274, "Estai preparados", "Azevedo Oliveira", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(275, "Feliz és tu", "C. Silva", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(276, "Lumen Christi", "Marco Daniel Duarte", "OTHER", {
        harmonizerName: "Sílvio Vicente",
        tagIds: [ADVENT]
    }),
    song(277, "Maranatha, Aleluia", "F. dos Santos", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(278, "No fim dos tempos", "José Pedro Martins", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(279, "O Anjo do Senhor", "M. Simões", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(280, "Ó vem, ó vem, Emanuel", "Stefan Karpinieci/Her. Faria", "OTHER", {
        tagIds: [ADVENT]
    }),
    song(281, "Preparai os caminhos do Senhor", "Miguel Carneiro", "OTHER", {
        tagIds: [ADVENT]
    }),

    // Capa 21 — Advento
    song(282, "Senhora do Advento", "P. Ferreira dos Santos", "OTHER", {
        tagIds: [ADVENT, MARIAN]
    }),
    song(283, "Vem, Senhor Jesus: Maranatha", "P. Ferreira dos Santos", "OTHER", {
        tagIds: [ADVENT]
    }),

    // Capa 21 — Natal
    song(284, "A vida que estava junto do Pai", "A. Cartageno", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(285, "Alegrem-se a terra e o mar", "Adeste fideles", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(286, "Aleluia! Glória a Deus", "F. Silva", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(287, "Bendita seja a virgem Maria", "Manuel Luís", "OTHER", {
        arrangerName: "Ant. Cartageno",
        tagIds: [CHRISTMAS, MARIAN]
    }),
    song(288, "Benedicat Vobis", "G. F. Haendel", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(289, "Brilha a luz da sua glória", "Ferreira dos Santos", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(290, "Cantem, cantem os Anjos", "M. Faria", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(291, "Comei pastorinhos", UNKNOWN, "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(292, "Cristo Nasceu", "C. Silva", "OTHER", {
        arrangerName: "J. E. Rebelo (NOVO)",
        tagIds: [CHRISTMAS]
    }),
    song(293, "Cristo nasceu", "C. Silva", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(294, "É Natal, Cristo nasceu", "António Cartageno", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(295, "Ergue os teus olhos", "F. dos Santos", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(296, "Exultemos de alegria no Senhor", "J. Santos", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(297, "Exultemos de alegria, adoremos o Senhor", "M. Luís", "OTHER", {
        arrangerName: "A. Cartageno",
        tagIds: [CHRISTMAS]
    }),
    song(298, "Glória a Deus e paz na terra", "Az. Oliveira", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(299, "Gloria in Excelsis Deo", "David Oliveira", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(300, "Gloria, gloria", "Cânone", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(301, "Na fria Lapinha", "J. F. Silva", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(302, "Nasceu hoje, de Maria", "J. Santos", "OTHER", {
        tagIds: [CHRISTMAS, MARIAN]
    }),

    // Capa 22 — Natal
    song(303, "No princípio antes de todos", "M. Luís", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(304, "Nós vimos a sua estrela", "Ferreira dos Santos", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(305, "Ó noite de Natal", "Az. Oliveira", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(306, "Ó Rei da glória lá do alto do Céu (só letra)", UNKNOWN, "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(307, "O Senhor nasceu, Aleluia", "Miguel Carneiro", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(308, "O Senhor virá", "P. Ferreira dos Santos", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(309, "O Senhor virá, o esplendor da sua glória", "Az. Oliveira (nº 64)", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(310, "O Verbo fez-Se carne", "C. Silva", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(311, "Os pastores vieram", "F. dos Santos", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(312, "Prece ao menino Jesus", "Manuel Ferreira de Faria", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(313, "Toda a terra exulte e cante", "M. Carneiro", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(314, "Vamos cantar, meu povo", "J. Fernandes da Silva", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(315, "Vamos todos a Belém", "A. Oliveira", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(316, "Venite Adoremus", "A. Cartageno", "OTHER", {
        tagIds: [CHRISTMAS]
    }),
    song(317, "Vinde adoremos", UNKNOWN, "OTHER", {
        tagIds: [CHRISTMAS]
    })
];
