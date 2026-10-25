import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const fail = (message) => { throw new Error('Hero portrait selection validation failed: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const targets = [1, 3, 4, 7, 9, 10, 11, 12, 13, 14, 25, 26, 27, 29, 33, 37, 40, 55, 56, 60, 67, 89];
const presentationIds = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 32, 33, 37, 40, 52, 53, 55, 56, 60, 67, 89];
const priorPresentationRecordSha256 = new Map([[1,'8a7c2f34dd698517d3463f08cf7afc3ba6427173b345cf580dcff93233d53ceb'],[3,'76d0974c5bcf4130dbb829d5f7de9fc20c704014542106271bfd04af9f433a50'],[5,'e4fd3b59ef45ccce5403a72e3fc4605c64bc245663e0fe83eb9e7e1b5c229a5e'],[6,'89846000923eca5eb3caa2710cb1ae69c01ece0e43ae7f6c34ea97533b290dcc'],[7,'8abf4a4bc9750081bac56c73c888a60905b8e4b96a9e1b841596663f12dc82a2'],[8,'7c48ca0482565539fdf7cb37120396dde111dcec6c37074940b7d51f70ca06af'],[10,'5c75e60f144db3b0642eeef90d1bf8e6be44006a00041be99f8eff0332421605'],[11,'1a6f1d7c373084857aff4f1f2ad4d8cccb38ff6fdb54161bab81dd340414c532'],[12,'dd96e797ed3044a7ff11e9d7e46c0dde34e32789c68b6087526e0dba5b68ffbc'],[13,'30f36de1c6cd4a0e8bedb2727d67cd128cbfde8c07f28712ac11501d0c00ab2d'],[14,'a961777a1df19c9719a95ab788258581fc841f154aba68f116f6a6fecc28b15e'],[25,'d6646591876be4c73d74dd1647e7b6a57f141139f26184f0c781b1d13cc9fbde'],[26,'93323b7d9a3967e5686cc01ae555b6cb466e17cd2b9d62eaaa7988bbc13f0f7c'],[27,'5b4f2df1e18b2d16238bf12ccb115ef97be32b219e0afd5dab68e9ee3e05194c'],[28,'c039ba3f560b90f418dc8f6c2665d5ff1bfc3afecf9832e3c08649bf9655c301'],[32,'5f4b54dcfb48e71fa3c105517c4fcef11ce7692f62867a81a09643771c319ee0'],[52,'c3431f4da9d96111115832d13a6151ae87837291e49f82e8c298c6a6db7d6658'],[53,'a24417323e71772052cc09381cf11d656280a95e12df1bdbe3d2df324c8bc6ab'],[55,'b1b1e9a2fc06a73d1e60fad96c448b8c24e936c3ff48e541cde22cc1c5561c8b'],[67,'db8ecaaec60f0ff527338fb71ed727940ab810244d1034c2f4927e7792811f88']]);
const reportPath = 'data/validation/hero-page-stage5-5-2-artwork.v1.json';
const reportBlob = '6e52ebf142d40d4a82709753e6c5a086dcfb299a';
const expected = new Map([
  [1, {
    charImageId: 1,
    heroPainting: 'UI/HeroPainting/SSR_ABS/Prefab/Matthew.prefab',
    shardPath: 'data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json',
    shardRecordLocator: 'data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json#heroes[heroId=1]',
    shardBlob: '3a6ca0062dc5aa53c9db44761e2559bc1819dd81',
    packageName: 'InstallPage_1.1.113_26.zip', packageIndex: 25, packageBytes: 113636260,
    bundleName: 'begin_ui_heropainting_ssr_abs.b', bundleBytes: 3710837,
    bundleMd5: '16CF10B79FF22F3CE1BF78B45D05DFA8',
    bundleSha256: '7C1551C8A4626CAA0BAB5E83A6A5BC4B3EF804E831D570C724D94193C4569F8A',
    bundleCrc32: 'A06A3B3B', prefabPathId: '1867250883360921302',
    spritePathId: '-592003083375786832', texturePathId: '5964614618677259072',
    pngBytes: 233141, pngSha256: '072bde658943017dfc68e35ff97c4666cf74848bbe53112d5d9c772fd38c4c4c',
    pngBlob: '6be2c74265182254f82e02b8d9f9892d0682b69c', width: 381, height: 812,
    rgbaSha256: '1d8b9cc76fae447f5e09b1c7d2549968f2c97d03806e7c5eb24ddebbc12745fc'
  }],
  [10, {
    charImageId: 10,
    heroPainting: 'UI/HeroPainting/SSR_ABS/Prefab/Ledyn.prefab',
    shardPath: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json',
    shardRecordLocator: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=10]',
    shardBlob: 'b6cb8f827367fc367af8c544aa6877a85bcfee32',
    packageName: 'InstallPage_1.1.113_61.zip', packageIndex: 60, packageBytes: 109027105,
    bundleName: 'ui_heropainting_ssr_abs.b', bundleBytes: 25793935,
    bundleMd5: '168B2D54E39D62B98CD1E92BDE9F787B',
    bundleSha256: '818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492',
    bundleCrc32: '4682CEA2', prefabPathId: '1928234516739052579',
    spritePathId: '-4548386853997343781', texturePathId: '-5312052482424697931',
    pngBytes: 305265, pngSha256: 'd838076bde84825e594f22db9b87ed8b869f26b2dfddf7395c506982ee87d73d',
    pngBlob: 'b3d4096cef027a4932d805e95fd09cf0d66f9296', width: 607, height: 833,
    rgbaSha256: '0f01c4a82fe7cc07e6c8574a2da2ff10648594a19e67dab7addb59b2e7e6e8ec'
  }],
  [25, {
    charImageId: 25,
    heroPainting: 'UI/HeroPainting/SSR_ABS/Prefab/Alutemurat.prefab',
    shardPath: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json',
    shardRecordLocator: 'data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=25]',
    shardBlob: 'b6cb8f827367fc367af8c544aa6877a85bcfee32',
    packageName: 'InstallPage_1.1.113_61.zip', packageIndex: 60, packageBytes: 109027105,
    bundleName: 'ui_heropainting_ssr_abs.b', bundleBytes: 25793935,
    bundleMd5: '168B2D54E39D62B98CD1E92BDE9F787B',
    bundleSha256: '818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492',
    bundleCrc32: '4682CEA2', prefabPathId: '8438785205446297998',
    spritePathId: '4814861067632038286', texturePathId: '1698989869838523429',
    pngBytes: 405481, pngSha256: '3f5862d8bb428bc3da433cbba7e147da9f10ffc76b67821abcb4602c1117adde',
    pngBlob: '2f50308ed297db01f9824bd0174a0b856fa69c6a', width: 548, height: 911,
    rgbaSha256: '3e466d8c0e00eab10a008f0dc21e7cfc35730e53df57714709a666487bef02c4'
  }],
  [3, {
    "charImageId": 3,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Grenier.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json#heroes[heroId=3]",
    "shardBlob": "3a6ca0062dc5aa53c9db44761e2559bc1819dd81",
    "packageName": "InstallPage_1.1.113_26.zip",
    "packageIndex": 25,
    "packageBytes": 113636260,
    "bundleName": "begin_ui_heropainting_ssr_abs.b",
    "bundleBytes": 3710837,
    "bundleMd5": "16CF10B79FF22F3CE1BF78B45D05DFA8",
    "bundleSha256": "7C1551C8A4626CAA0BAB5E83A6A5BC4B3EF804E831D570C724D94193C4569F8A",
    "bundleCrc32": "A06A3B3B",
    "prefabPathId": "2379866903544210750",
    "spritePathId": "639412478775696337",
    "texturePathId": "7747863799803620895",
    "pngBytes": 238677,
    "pngSha256": "440677163c7297bdc6b13fb29cffc273c324b6682209522fa932e20d4fd0e165",
    "pngBlob": "28006e9d0ce1dc52f2928d1a349391e1b5f86e5f",
    "width": 407,
    "height": 986,
    "rgbaSha256": "341105a59778a386bb5188d6e30e289c4f556e93fe81ec781346a2ff864c0ada",
    "heroIndex": 2,
    "charImageIndex": 1,
    "heroRecord": {
        "ID": 3,
        "Name": "格尼尔",
        "Name_Eng": "Grenier",
        "Useable": true,
        "CharImage_ID": 3
    }
}],
  [4, {
    "charImageId": 4,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Aimeeda.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json#heroes[heroId=4]",
    "shardBlob": "3a6ca0062dc5aa53c9db44761e2559bc1819dd81",
    "packageName": "InstallPage_1.1.113_26.zip",
    "packageIndex": 25,
    "packageBytes": 113636260,
    "bundleName": "begin_ui_heropainting_ssr_abs.b",
    "bundleBytes": 3710837,
    "bundleMd5": "16CF10B79FF22F3CE1BF78B45D05DFA8",
    "bundleSha256": "7C1551C8A4626CAA0BAB5E83A6A5BC4B3EF804E831D570C724D94193C4569F8A",
    "bundleCrc32": "A06A3B3B",
    "prefabPathId": "5595021069487437813",
    "spritePathId": "2356460918224325981",
    "texturePathId": "5964614618677259072",
    "pngBytes": 172310,
    "pngSha256": "7e2f806b4b23c28f93b9b949c308eb1c981874ba9cd79e929eeaa2183e5cdf9b",
    "pngBlob": "cf49736706b75da986cd71ab19b37eb4fbd22041",
    "width": 277,
    "height": 770,
    "rgbaSha256": "50c157dac8dac9c4d65eed33eda6d610704b6c136027c64c796c80b98de4c97b",
    "heroIndex": 3,
    "charImageIndex": 2,
    "heroRecord": {
        "ID": 4,
        "Name": "艾梅达",
        "Name_Eng": "Aimeeda",
        "Useable": true,
        "CharImage_ID": 4
    }
}],
  [7, {
    "charImageId": 7,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Bernhardt.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=7]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-7741299618317976723",
    "spritePathId": "-387997680886506757",
    "texturePathId": "-3990265620095198334",
    "pngBytes": 455546,
    "pngSha256": "c4355c375da225a625b792367db273cd0111a0b2e061a21a45ea280379c23f0f",
    "pngBlob": "550079b01196eb036ffb274e470b4ddb44b85633",
    "width": 753,
    "height": 935,
    "rgbaSha256": "e426338243a5198316c97602e66596f793695774f6ec2a8fa2ae8bfd9a41d62b",
    "heroIndex": 6,
    "charImageIndex": 5,
    "heroRecord": {
        "ID": 7,
        "Name": "巴恩哈特",
        "Name_Eng": "Bernhardt",
        "Useable": true,
        "CharImage_ID": 7
    }
}],
  [9, {
    "charImageId": 9,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Bozel.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=9]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-4625550339973129610",
    "spritePathId": "3599312645041572683",
    "texturePathId": "3859372328942134523",
    "pngBytes": 399655,
    "pngSha256": "7f4dab52b096398ca5f7de8e0c00a1fc7f589603ac3eb1c3c519ec569c0d203d",
    "pngBlob": "f65e540ac69f6a677cdb58a2dce86f15b5f8d514",
    "width": 743,
    "height": 981,
    "rgbaSha256": "16ff4b051623ec209032ff2407c77c6ea9801ea4c5b0b25dfb3a1548f0834ab4",
    "heroIndex": 8,
    "charImageIndex": 7,
    "heroRecord": {
        "ID": 9,
        "Name": "波赞鲁",
        "Name_Eng": "Bozel",
        "Useable": true,
        "CharImage_ID": 9
    }
}],
  [11, {
    "charImageId": 11,
    "heroPainting": "UI/HeroPainting/SR_ABS/Prefab/Nurm.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_sr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_sr_abs-b.json#heroes[heroId=11]",
    "shardBlob": "b989c2cc29e520e1004c3a1b27338839df84d0e7",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_sr_abs.b",
    "bundleBytes": 4204670,
    "bundleMd5": "50C4FFD5AB6F7CBD8A0B39117F9CA101",
    "bundleSha256": "294750FF12725BF5B8DF906B6CFAB702AF6352F7BAAF2203553E3E5EACDE8ED2",
    "bundleCrc32": "BD688F0F",
    "prefabPathId": "-3361140095441352504",
    "spritePathId": "3867621537412067373",
    "texturePathId": "8286383844118524683",
    "pngBytes": 142640,
    "pngSha256": "47ab77fb1927262d8cb632ea109f3ce16cebbe86668d73f01fb9f31bcee83250",
    "pngBlob": "9795e3542fa01c1ffd8f9117af87a80866146f1d",
    "width": 216,
    "height": 749,
    "rgbaSha256": "8b0a70512839b6a0d93bb18c5068d74091d3b1cfa1f1c6b03c46d4e87f9cc328",
    "heroIndex": 10,
    "charImageIndex": 9,
    "heroRecord": {
        "ID": 11,
        "Name": "娜姆",
        "Name_Eng": "Nurm",
        "Useable": true,
        "CharImage_ID": 11
    }
}],
  [12, {
    "charImageId": 12,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Elwin.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=12]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "123499102554842030",
    "spritePathId": "1754904592508790156",
    "texturePathId": "-4777522484743103452",
    "pngBytes": 254740,
    "pngSha256": "079f93df0579cff93bc51caba81c5326a04dc824711ce55ccdd59fd356a54700",
    "pngBlob": "2a6244233d87242d80ca2dd8de9c2bedf8a1e392",
    "width": 501,
    "height": 806,
    "rgbaSha256": "f7ae5ff1c09f50545d170503d32feb92206948eab625fabdd7ec173f96c95059",
    "heroIndex": 11,
    "charImageIndex": 10,
    "heroRecord": {
        "ID": 12,
        "Name": "艾尔文",
        "Name_Eng": "Elwin",
        "Useable": true,
        "CharImage_ID": 12
    }
}],
  [13, {
    "charImageId": 13,
    "heroPainting": "UI/HeroPainting/SR_ABS/Prefab/Hein.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_sr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_sr_abs-b.json#heroes[heroId=13]",
    "shardBlob": "b989c2cc29e520e1004c3a1b27338839df84d0e7",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_sr_abs.b",
    "bundleBytes": 4204670,
    "bundleMd5": "50C4FFD5AB6F7CBD8A0B39117F9CA101",
    "bundleSha256": "294750FF12725BF5B8DF906B6CFAB702AF6352F7BAAF2203553E3E5EACDE8ED2",
    "bundleCrc32": "BD688F0F",
    "prefabPathId": "1702538137014189570",
    "spritePathId": "-1310573539659438491",
    "texturePathId": "-8778693388439772692",
    "pngBytes": 195420,
    "pngSha256": "fe5e0673aefc2bdb35ce0dec1fb6116c48f11f2a1bafa90f786134bd315147fb",
    "pngBlob": "2f7b27ce39e7858c48759dee60865c9030cb474d",
    "width": 369,
    "height": 821,
    "rgbaSha256": "eb39d4dd5fb2f6161354187820871d53338173006ace0abd8fd8ac18e8c59c56",
    "heroIndex": 12,
    "charImageIndex": 11,
    "heroRecord": {
        "ID": 13,
        "Name": "海恩",
        "Name_Eng": "Hein",
        "Useable": true,
        "CharImage_ID": 13
    }
}],
  [14, {
    "charImageId": 14,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Sherry.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=14]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-7286218436758649196",
    "spritePathId": "-6646698178875666458",
    "texturePathId": "302953679246288277",
    "pngBytes": 159097,
    "pngSha256": "31f557d04dd2945eb74bd8cb7f522755c2972119a0f6e39df52591cb864f54c2",
    "pngBlob": "b156ef7434872c4f5ca48d267c5982b14e345a55",
    "width": 310,
    "height": 688,
    "rgbaSha256": "87501974776871e2f5eb4e42cc74c8bb35b0575cc99a8e9b80696d9990dd05d3",
    "heroIndex": 13,
    "charImageIndex": 12,
    "heroRecord": {
        "ID": 14,
        "Name": "雪莉",
        "Name_Eng": "Sherry",
        "Useable": true,
        "CharImage_ID": 14
    }
}],
  [26, {
    "charImageId": 26,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Luna.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=26]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-6343440438983149781",
    "spritePathId": "7635465343284411404",
    "texturePathId": "-5066933127276073457",
    "pngBytes": 276218,
    "pngSha256": "e54a4437252335257cac6a2e618f56929814415e7f261bb3435c8a897610a7a9",
    "pngBlob": "fb4e0511b5f8bd18f013dff2bdcc6b3e8a7d9960",
    "width": 426,
    "height": 754,
    "rgbaSha256": "a4bfd5939aee72c8cf49f9b2a83d514f9a355efc40298253f66cbfb57d228534",
    "heroIndex": 25,
    "charImageIndex": 24,
    "heroRecord": {
        "ID": 26,
        "Name": "露娜",
        "Name_Eng": "Luna",
        "Useable": true,
        "CharImage_ID": 26
    }
}],
  [27, {
    "charImageId": 27,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Dehault.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=27]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-6501104219807535849",
    "spritePathId": "-6988173867239098605",
    "texturePathId": "-5066933127276073457",
    "pngBytes": 340052,
    "pngSha256": "a063a544eeb10eb1e256ebdd6d2add24eadf57a1cdb20aa4693bb3eace97b60f",
    "pngBlob": "cb7fcdc6c2748f7c21547fc258c2a7bc661cdbc7",
    "width": 502,
    "height": 874,
    "rgbaSha256": "d02c43010d98ce13d9ab47583a7097b0ed71d713f5ba4bcbf69047c72b6aabf2",
    "heroIndex": 26,
    "charImageIndex": 25,
    "heroRecord": {
        "ID": 27,
        "Name": "迪哈尔特",
        "Name_Eng": "Dehault",
        "Useable": true,
        "CharImage_ID": 27
    }
}],
  [29, {
    "charImageId": 29,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Tialice.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=29]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-6889724944141152454",
    "spritePathId": "3697869813436154957",
    "texturePathId": "-4777522484743103452",
    "pngBytes": 153285,
    "pngSha256": "d41a50c53a45e32a52754fbf433b587c78c40fac5c7906862bcf8b4d9a9899bb",
    "pngBlob": "253e5b192c8e3132a57a6e028e4a61dacd77f6e3",
    "width": 274,
    "height": 727,
    "rgbaSha256": "dea8ce563c0881bf5892b344bc910fd63437ea9bcb4fd93645168cc1a546a33d",
    "heroIndex": 28,
    "charImageIndex": 27,
    "heroRecord": {
        "ID": 29,
        "Name": "蒂亚莉丝",
        "Name_Eng": "Tialice",
        "Useable": true,
        "CharImage_ID": 29
    }
}],
  [33, {
    "charImageId": 33,
    "heroPainting": "UI/HeroPainting/SR_ABS/Prefab/Freya.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_sr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_sr_abs-b.json#heroes[heroId=33]",
    "shardBlob": "b989c2cc29e520e1004c3a1b27338839df84d0e7",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_sr_abs.b",
    "bundleBytes": 4204670,
    "bundleMd5": "50C4FFD5AB6F7CBD8A0B39117F9CA101",
    "bundleSha256": "294750FF12725BF5B8DF906B6CFAB702AF6352F7BAAF2203553E3E5EACDE8ED2",
    "bundleCrc32": "BD688F0F",
    "prefabPathId": "669347199730249556",
    "spritePathId": "4008716352605829561",
    "texturePathId": "-7418361394170269562",
    "pngBytes": 195518,
    "pngSha256": "887ad308313752f10d9f116e513340ad009c6dc374557229b563b9241f6d5f07",
    "pngBlob": "e5f330202ea4f4b1f2bab53a9b549cda126dfe65",
    "width": 364,
    "height": 677,
    "rgbaSha256": "73c7c89c522a8137d51e9c3c8e66921b516638e1a885ed199bb40a5a4394647a",
    "heroIndex": 32,
    "charImageIndex": 31,
    "heroRecord": {
        "ID": 33,
        "Name": "芙蕾雅",
        "Name_Eng": "Freya",
        "Useable": true,
        "CharImage_ID": 33
    }
}],
  [37, {
    "charImageId": 37,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Zillagod.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=37]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "4512860616445804474",
    "spritePathId": "7890803514582299432",
    "texturePathId": "-4282351221329670977",
    "pngBytes": 108230,
    "pngSha256": "b4083230d938f3087ac11ea4274c89fa65fe55ba00c8ec3de049df27748a5397",
    "pngBlob": "62abf1f00e93806c60af72fc0be3c5f9091dac59",
    "width": 360,
    "height": 442,
    "rgbaSha256": "a676e847e2b1bc878bd59bbb22ffdab8304c067f9827b54cff6dd130c3ca13e1",
    "heroIndex": 36,
    "charImageIndex": 35,
    "heroRecord": {
        "ID": 37,
        "Name": "古巨拉",
        "Name_Eng": "Zillagod",
        "Useable": true,
        "CharImage_ID": 37
    }
}],
  [40, {
    "charImageId": 40,
    "heroPainting": "UI/HeroPainting/R_ABS/Prefab/Rune.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_r_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_r_abs-b.json#heroes[heroId=40]",
    "shardBlob": "cbdc11c917b719dda77c7d012f13571986022d1b",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_r_abs.b",
    "bundleBytes": 1234370,
    "bundleMd5": "19C940F7E635EC502768E701496F92B9",
    "bundleSha256": "4F5E6D8202DC62E483CB090973BE9FFB80B0B96B0354358259EEF62BC8BBCA25",
    "bundleCrc32": "CE79F47D",
    "prefabPathId": "-8204532152452420953",
    "spritePathId": "8259388719695507202",
    "texturePathId": "-933202103544363045",
    "pngBytes": 229011,
    "pngSha256": "364682d7b26295a6c3e149cf811b044a33a8bd262ab14332095ee5672a501dbe",
    "pngBlob": "4fab685242e4bea5b8bdac422dc71478ab27b0c3",
    "width": 362,
    "height": 723,
    "rgbaSha256": "4f9a0abb2c77d0b5150659412153fde933438d7a38029fede9a817e4669b9b5b",
    "heroIndex": 39,
    "charImageIndex": 38,
    "heroRecord": {
        "ID": 40,
        "Name": "路因",
        "Name_Eng": "Rune",
        "Useable": true,
        "CharImage_ID": 40
    }
}],
  [55, {
    "charImageId": 55,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Landius.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=55]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "2365707134169094479",
    "spritePathId": "-777963805903884275",
    "texturePathId": "-7982772697075710790",
    "pngBytes": 316066,
    "pngSha256": "2ffa0d63d4cdcd05cc6a1c3c532feda11718a721ea57c77a9e7187fe0ddc6b1e",
    "pngBlob": "1833a0c8578356f0d2eba0d72b8d9f2c28949df1",
    "width": 498,
    "height": 840,
    "rgbaSha256": "b2aaf7ca42f8561ac18025f55e8e2a88f10dc1ec632fd28f069977b69de38abd",
    "heroIndex": 54,
    "charImageIndex": 53,
    "heroRecord": {
        "ID": 55,
        "Name": "兰迪乌斯",
        "Name_Eng": "Landius",
        "Useable": true,
        "CharImage_ID": 55
    }
}],
  [56, {
    "charImageId": 56,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Rachel.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=56]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "148366394623714461",
    "spritePathId": "-5107005295127119908",
    "texturePathId": "-7982772697075710790",
    "pngBytes": 216593,
    "pngSha256": "9035634bc31d1dad453b4f8339e52f8f6f3dd97dd7db88dc9ea6d2c06d8af813",
    "pngBlob": "c718f65d519feca41a3eb628723558014954c6bc",
    "width": 330,
    "height": 684,
    "rgbaSha256": "58506cb9f0db59f81124e71fba128fc6282f5afa8d24be7c9877ed18ba828d65",
    "heroIndex": 55,
    "charImageIndex": 54,
    "heroRecord": {
        "ID": 56,
        "Name": "蕾伽尔",
        "Name_Eng": "Rachel",
        "Useable": true,
        "CharImage_ID": 56
    }
}],
  [60, {
    "charImageId": 60,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Sigma.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=60]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-4866855794712166627",
    "spritePathId": "4703756411334852072",
    "texturePathId": "-2464085502538929405",
    "pngBytes": 256329,
    "pngSha256": "0e07e34ee48aece18d4ac920cba9212274fccc57a90d8ccddab5d8126d266b7a",
    "pngBlob": "b11040699adfcc6312e8f02946b3f906754dd9bf",
    "width": 447,
    "height": 800,
    "rgbaSha256": "237db8de0cac16db31587611e81f1128459401bcdb6a6e1492750497c1f9fc71",
    "heroIndex": 59,
    "charImageIndex": 58,
    "heroRecord": {
        "ID": 60,
        "Name": "西格玛",
        "Name_Eng": "Sigma",
        "Useable": true,
        "CharImage_ID": 60
    }
}],
  [67, {
    "charImageId": 67,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Omega.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/ui_heropainting_ssr_abs-b.json#heroes[heroId=67]",
    "shardBlob": "b6cb8f827367fc367af8c544aa6877a85bcfee32",
    "packageName": "InstallPage_1.1.113_61.zip",
    "packageIndex": 60,
    "packageBytes": 109027105,
    "bundleName": "ui_heropainting_ssr_abs.b",
    "bundleBytes": 25793935,
    "bundleMd5": "168B2D54E39D62B98CD1E92BDE9F787B",
    "bundleSha256": "818942EA601B584D007D97A0E2A388554AFBAF6A83A36302E241601015D87492",
    "bundleCrc32": "4682CEA2",
    "prefabPathId": "-4464678954586785275",
    "spritePathId": "5226430858343995410",
    "texturePathId": "1180821018580556399",
    "pngBytes": 385712,
    "pngSha256": "5347eba9b7577b3be8e1a3c83dff13ca4bc296366c3ef3a5ed4bba0d570b6bd3",
    "pngBlob": "2d96132ff8f4c625a15f1bf537586871bf529047",
    "width": 568,
    "height": 896,
    "rgbaSha256": "749123c2c5cf4d04e550caaffb6401578955773e241022b2a9a1888d3904597d",
    "heroIndex": 66,
    "charImageIndex": 65,
    "heroRecord": {
        "ID": 67,
        "Name": "欧米伽",
        "Name_Eng": "Omega",
        "Useable": true,
        "CharImage_ID": 67
    }
}],
  [89, {
    "charImageId": 89,
    "heroPainting": "UI/HeroPainting/SSR_ABS/Prefab/Yulia.prefab",
    "shardPath": "data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json",
    "shardRecordLocator": "data/generated/hero-artwork-h-a5-index.v1/begin_ui_heropainting_ssr_abs-b.json#heroes[heroId=89]",
    "shardBlob": "3a6ca0062dc5aa53c9db44761e2559bc1819dd81",
    "packageName": "InstallPage_1.1.113_26.zip",
    "packageIndex": 25,
    "packageBytes": 113636260,
    "bundleName": "begin_ui_heropainting_ssr_abs.b",
    "bundleBytes": 3710837,
    "bundleMd5": "16CF10B79FF22F3CE1BF78B45D05DFA8",
    "bundleSha256": "7C1551C8A4626CAA0BAB5E83A6A5BC4B3EF804E831D570C724D94193C4569F8A",
    "bundleCrc32": "A06A3B3B",
    "prefabPathId": "-4156480565866960172",
    "spritePathId": "7931551033353238552",
    "texturePathId": "6596872270571404785",
    "pngBytes": 497887,
    "pngSha256": "54df3265db63a6ba2e44ce151096fa6aff9686790efdc9a58650ebe5fc0baabb",
    "pngBlob": "59f1f9295db3e183a36a7791887732452b48cb4c",
    "width": 622,
    "height": 901,
    "rgbaSha256": "d10e09131ab755f94135336c13ea457c7c1c81b633e20c9216179acc36f5364f",
    "heroIndex": 87,
    "charImageIndex": 86,
    "heroRecord": {
        "ID": 89,
        "Name": "尤利娅",
        "Name_Eng": "Yulia",
        "Useable": true,
        "CharImage_ID": 89
    }
}]
]);

export async function validateHeroPortraitSelection(root = process.cwd()) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const evidence = await readJson('evidence/source/portraits/hero-portrait-selection.v1.json');
  const slice = await readJson('evidence/source/portraits/hero-portrait-slice.v1.json');
  const expansion = await readJson('evidence/source/portraits/hero-portrait-expansion.v1.json');
  const canonical = await readJson('canonical/heroes.v1.json');
  const generatedPath = resolve(root, 'generated/hero-slice.v1.json');
  const generatedBytes = await readFile(generatedPath);
  const generated = JSON.parse(generatedBytes.toString('utf8'));

  check(evidence.schemaVersion === 1 && evidence.canonical === false && evidence.generated === false
    && evidence.productionRuntimeDependency === false, 'evidence metadata drift');
  check(JSON.stringify(evidence.scope.heroIds) === JSON.stringify(targets)
    && JSON.stringify(evidence.scope.charImageIds) === JSON.stringify(targets.map((id) => expected.get(id).charImageId))
    && evidence.scope.claimClass === 'per-record', 'selection packet scope drift');
  check(evidence.source.repository === 'LuceatLuxVestra42/langrisser-future-guide'
    && evidence.source.commit === '6475e63ee23d18adf733756c26a14fa9e3ed662c'
    && evidence.source.heroInfo.path === 'data/configdata/ConfigDataHeroInfo.json'
    && evidence.source.heroInfo.gitBlobSha1 === '728daab3370f0c7779449663ea02e638677944d4'
    && evidence.source.charImageInfo.path === 'data/configdata/ConfigDataCharImageInfo.json'
    && evidence.source.charImageInfo.gitBlobSha1 === '397afb3e76c0fe4f3e424c04ba68459ff48d74c5', 'ConfigData source pin drift');
  check(evidence.source.heroInfo.rawRecordDirectlyInspected === false
    && evidence.source.charImageInfo.rawRecordDirectlyInspected === false
    && JSON.stringify(evidence.source.heroInfo.directInspectionLimitationAppliesToHeroIds) === '[1,10,25]'
    && JSON.stringify(evidence.source.charImageInfo.directInspectionLimitationAppliesToHeroIds) === '[1,10,25]', 'raw ConfigData direct-inspection limitation must remain explicit');
  check(evidence.source.frozenJoinValidation.path === reportPath
    && evidence.source.frozenJoinValidation.gitBlobSha1 === reportBlob
    && evidence.source.frozenJoinValidation.status === 'PASS'
    && evidence.source.frozenJoinValidation.sourceJoin === 'ConfigDataHeroInfo.CharImage_ID -> ConfigDataCharImageInfo.ID'
    && evidence.source.frozenJoinValidation.claimClass === 'B', 'frozen source-join validation anchor drift');
  check(evidence.predecessor.hA5Index.sourceIndexCommit === '68ab3c9c1e49fdc2f0bf2b0da324ac53da12b2fb'
    && evidence.predecessor.hA5Index.manifestSha256 === 'AC08E7A03B033A10269E330F4E60D3B6A72D68AC6C68EFED37F48372E4E462F6'
    && evidence.predecessor.hA6Materialization.status === 'PASS_H_A6_HERO_ARTWORK_MATERIALIZATION'
    && evidence.predecessor.hA6Materialization.exactPngHashMatchCount === 267
    && evidence.predecessor.hA6Materialization.exactDimensionMatchCount === 267, 'predecessor extraction/materialization anchor drift');
  check(evidence.predecessor.hA6Materialization.webManifestPath === 'data/generated/hero-artwork-h-a6-web-assets.v1.json'
    && evidence.predecessor.hA6Materialization.webManifestGitBlobSha1 === 'f8ab2f4e053d0c0012c7453c009b72363f5df0c6'
    && evidence.predecessor.hA6Materialization.webManifestSha256 === 'D9B949AA3BA97CF8E89CB27517CE2E47FAE1CE20E5790EFA6E1A5C0F65BFD40B',
  'H-A6 web asset manifest pin drift');
  check(Array.isArray(evidence.records) && JSON.stringify(evidence.records.map((r) => r.heroId)) === JSON.stringify(targets)
    && new Set(evidence.records.map((r) => r.heroId)).size === targets.length, 'selection evidence population must match explicit targets');
  check(JSON.stringify(slice.scope.heroes) === JSON.stringify([5, 6, 8]) && slice.records.length === 3
    && JSON.stringify(expansion.scope.heroIds) === JSON.stringify([28, 32, 52, 53]) && expansion.records.length === 4,
  'existing slice or expansion population changed');
  check(JSON.stringify(canonical.records.map((r) => r.id)) === JSON.stringify(presentationIds)
    && JSON.stringify(generated.heroes.map((r) => r.id)) === JSON.stringify(presentationIds), 'Hero Presentation population changed');
  for (const [heroId, expectedSha256] of priorPresentationRecordSha256) {
    const row = generated.heroes.find((hero) => hero.id === heroId);
    const priorShape = row ? structuredClone(row) : null;
    if ([6, 8].includes(heroId)) {
      for (const talentRow of priorShape?.talent?.starDescriptions ?? []) {
        delete talentRow.nameCn;
        delete talentRow.descriptionCn;
      }
      delete priorShape?.jobLevelSourceStats;
    }
    check(priorShape && createHash('sha256').update(JSON.stringify(priorShape)).digest('hex') === expectedSha256,
      `Prior Hero ${heroId} generated record parity mismatch`);
  }

  check(evidence.predecessor.packageIdentity.fullPackageCryptographicHash === 'not recorded'
    && evidence.predecessor.packageIdentity.configDataAndClientReleaseSynchronization === 'not independently established',
  'historical package/release limitation drift');
  for (const row of evidence.records) {
    const want = expected.get(row.heroId);
    check(want && row.charImageId === want.charImageId, `frozen HeroInfo.CharImage_ID claim mismatch for ${row.heroId}`);
    check(row.heroPainting === want.heroPainting, `frozen CharImageInfo.HeroPainting claim mismatch for ${row.heroId}`);
    if ([1, 10, 25].includes(row.heroId)) {
      check(row.heroInfoLocator === `${reportPath}#representativeHeroes[heroId=${row.heroId}].charImageId`
        && row.charImageInfoLocator === `${reportPath}#representativeHeroes[heroId=${row.heroId}].values.HeroPainting`, `frozen report locator mismatch for ${row.heroId}`);
      check(row.relationClass === 'B' && row.charImageIdClass === 'B' && row.heroPaintingRoleClass === 'B'
        && row.sourceAssetClass === 'B' && row.reproducibilityClass === 'B', `inherited evidence class drift for ${row.heroId}`);
    } else {
      check(row.heroInfoLocator === `data/configdata/ConfigDataHeroInfo.json#[ID=${row.heroId}].CharImage_ID`
        && row.charImageInfoLocator === `data/configdata/ConfigDataCharImageInfo.json#[ID=${want.charImageId}].HeroPainting`,
      `direct raw record locator mismatch for ${row.heroId}`);
      check(row.relationClass === 'A' && row.charImageIdClass === 'A' && row.heroPaintingFieldClass === 'A'
        && row.heroPaintingRoleClass === 'B' && row.sourceAssetClass === 'B' && row.reproducibilityClass === 'B',
      `claim-scoped evidence class drift for ${row.heroId}`);
      const direct = row.directSource;
      check(direct?.heroInfo?.rawRecordDirectlyInspected === true && direct?.charImageInfo?.rawRecordDirectlyInspected === true
        && direct.heroInfo.arrayIndex === want.heroIndex && direct.charImageInfo.arrayIndex === want.charImageIndex,
      `direct inspection record/index mismatch for ${row.heroId}`);
      const hero = direct.heroInfo.record;
      check(Object.keys(want.heroRecord).every((key) => hero[key] === want.heroRecord[key])
        && hero.ID === row.heroId && hero.CharImage_ID === row.charImageId
        && direct.charImageInfo.record.ID === hero.CharImage_ID
        && direct.charImageInfo.record.HeroPainting === row.heroPainting,
      `direct source foreign-key/field mismatch for ${row.heroId}`);
      check(direct.spriteReextractionPerformed === false && typeof direct.interpretation === 'string'
        && direct.interpretation.includes('inherited B'), `extraction reuse limitation missing for ${row.heroId}`);
    }

    const extraction = row.predecessorExtraction;
    check(extraction.recordPath === want.shardPath && extraction.recordGitBlobSha1 === want.shardBlob
      && extraction.recordLocator === want.shardRecordLocator
      && extraction.recordHeroId === row.heroId && extraction.sourceArtworkPath === want.heroPainting
      && extraction.selectionStatus === 'UNIQUE_REFERENCED_SPRITE', `H-A5 source selection mismatch for ${row.heroId}`);
    check(extraction.packageName === want.packageName && extraction.packageIndex === want.packageIndex
      && extraction.packageBytes === want.packageBytes && extraction.bundleName === want.bundleName
      && extraction.bundleBytes === want.bundleBytes && extraction.bundleMd5 === want.bundleMd5
      && extraction.bundleSha256 === want.bundleSha256 && extraction.bundleCrc32 === want.bundleCrc32,
    `H-A5 package/bundle provenance mismatch for ${row.heroId}`);
    check(extraction.prefabPathId === want.prefabPathId && extraction.spritePathId === want.spritePathId
      && extraction.texturePathId === want.texturePathId, `H-A5 Unity PPtr locator mismatch for ${row.heroId}`);

    const sourcePng = row.predecessorPng;
    const asset = row.extractedSourcePng;
    check(sourcePng.path === `public/images/heroes/cards/${row.heroId}.png`
      && sourcePng.recordLocator === `data/generated/hero-artwork-h-a6-web-assets.v1.json#records[heroId=${row.heroId}]`
      && sourcePng.gitBlobSha1 === want.pngBlob && sourcePng.bytes === want.pngBytes
      && sourcePng.sha256 === want.pngSha256 && sourcePng.width === want.width && sourcePng.height === want.height,
    `H-A6 source PNG manifest mismatch for ${row.heroId}`);
    check(sourcePng.bytes === asset.bytes && sourcePng.sha256 === asset.sha256
      && sourcePng.width === asset.width && sourcePng.height === asset.height
      && asset.path === `assets/portraits/hero-${row.heroId}.png` && asset.bytesClass === 'A', `asset metadata mismatch for ${row.heroId}`);
    const full = resolve(root, asset.path);
    check(full.startsWith(resolve(root) + sep), `asset path escapes repository for ${row.heroId}`);
    const bytes = await readFile(full);
    check(bytes.length === asset.bytes, `PNG byte length mismatch for ${row.heroId}`);
    check(createHash('sha256').update(bytes).digest('hex') === asset.sha256, `PNG SHA-256 mismatch for ${row.heroId}`);
    const gitSha = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    check(gitSha === sourcePng.gitBlobSha1, `PNG Git blob parity mismatch for ${row.heroId}`);
    check(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), `invalid PNG signature for ${row.heroId}`);
    check(bytes.readUInt32BE(16) === asset.width && bytes.readUInt32BE(20) === asset.height,
      `PNG dimensions mismatch for ${row.heroId}`);
    check(createHash('sha256').update(bytes).digest('hex') === want.pngSha256
      && want.rgbaSha256.length === 64, `verified PNG content pin mismatch for ${row.heroId}`);
  }
  process.stdout.write(`Hero portrait selection: PASS (3 inherited source joins; ${targets.length - 3} direct raw joins; ${targets.length} exact H-A5 Sprite selections; ${targets.length} PNG byte/hash/dimension matches; 29-Hero Generated parity)\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  await validateHeroPortraitSelection();
}
