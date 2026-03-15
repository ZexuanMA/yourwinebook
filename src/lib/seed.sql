-- Your Wine Book — Seed Data
-- Run after schema.sql to populate initial data.

-- ============================================================
-- Merchants (6)
-- ============================================================
INSERT INTO merchants (slug, name, description_zh, description_en, details_zh, details_en, wines_listed, best_prices, rating) VALUES
('watsons-wine', 'Watson''s Wine', '深耕香港葡萄酒市場超過二十年，Watson''s Wine 擁有全港最齊全的葡萄酒庫存之一。從日常餐酒到珍藏年份，為每位愛酒人提供可靠的選擇。', 'With over twenty years in the Hong Kong wine market, Watson''s Wine offers one of the city''s most comprehensive wine selections.', ARRAY['📍 全港多間門店','🚚 次日送達','💳 支持多種付款方式'], ARRAY['📍 Multiple locations','🚚 Next-day delivery','💳 Multiple payment options'], 126, 23, 4.6),
('wine-and-co', 'Wine & Co', '專注歐洲精品酒莊的進口商，主打法國、意大利小農酒。每支酒都有故事，每個年份都值得細品。', 'A boutique importer focused on European artisan wineries — mainly French and Italian small producers.', ARRAY['📍 中環門店','🚚 港島即日送','💳 Wine Club 會員折扣'], ARRAY['📍 Central shop','🚚 Same-day HK Island','💳 Wine Club discounts'], 89, 15, 4.7),
('cellardoor', 'CellarDoor', '新世代線上酒舖，以年輕化選酒和親民定價著稱。網站介面清爽，下單方便，經常有限時優惠。', 'A new-generation online wine shop known for approachable selections and fair pricing.', ARRAY['📍 純線上','🚚 免費送貨滿$500','💳 信用卡/FPS'], ARRAY['📍 Online only','🚚 Free delivery over $500','💳 Credit card / FPS'], 74, 18, 4.4),
('vinhk', 'VinHK', '主打自然酒和有機酒的專門店，為注重健康和風土的飲家提供獨特選擇。', 'Specializing in natural and organic wines for health-conscious drinkers who care about terroir.', ARRAY['📍 西營盤門店','🚚 預約送貨','💳 現金/轉數快'], ARRAY['📍 Sai Ying Pun shop','🚚 Scheduled delivery','💳 Cash / FPS'], 62, 10, 4.5),
('grape-hk', 'Grape HK', '以批量採購壓低成本，提供極具競爭力的價格。適合想囤貨或團購的消費者。', 'Leverages bulk purchasing for competitive pricing. Great for stocking up or group buys.', ARRAY['📍 觀塘倉庫自取','🚚 購滿12支免運','💳 銀行轉帳優惠'], ARRAY['📍 Kwun Tong warehouse pickup','🚚 Free shipping 12+ bottles','💳 Bank transfer discount'], 95, 28, 4.3),
('bottleshop', 'BottleShop', '精選世界各地得獎酒款，每月推出主題酒單。適合想嘗鮮又不想踩雷的飲家。', 'Curated award-winning wines from around the world with monthly themed selections.', ARRAY['📍 銅鑼灣門店','🚚 標準配送','💳 多種付款'], ARRAY['📍 Causeway Bay shop','🚚 Standard delivery','💳 Multiple payment options'], 83, 12, 4.5);

-- ============================================================
-- Scenes (4)
-- ============================================================
INSERT INTO scenes (slug, title_zh, title_en, description_zh, description_en, emoji) VALUES
('gift', '送禮', 'Gifting', '體面又有心意的酒款推薦', 'Thoughtful wine gift recommendations', '🎁'),
('dinner', '聚餐配酒', 'Pair with Dinner', '今晚吃什麼，就配什麼', 'Tonight''s menu decides the wine', '🍽'),
('everyday', '日常小酌', 'Everyday Sips', '下班後的小確幸', 'After-work happiness in a glass', '🍷'),
('explore', '探索新世界', 'Explore New Wines', '跳出舒適圈，試試不一樣的', 'Step outside your comfort zone', '🌍');

-- ============================================================
-- Wines (32)
-- ============================================================
INSERT INTO wines (slug, name, type, region_zh, region_en, grape_variety, vintage, description_zh, description_en, min_price, merchant_count, emoji, badge, is_featured, tasting_notes, region_story_zh, region_story_en) VALUES
-- 1
('cloudy-bay-sauvignon-blanc-2023', 'Cloudy Bay Sauvignon Blanc 2023', 'white', '紐西蘭 · 馬爾堡羅 · 白酒', 'New Zealand · Marlborough · White', 'Sauvignon Blanc', 2023, '如果你喜歡清爽不膩的白酒，這支很難踩雷。帶點青草和柑橘香氣，配海鮮特別好。', 'If you like crisp, refreshing whites, this one rarely disappoints. Hints of fresh grass and citrus.', 138, 6, '🍾', 'Editor''s Pick', true,
'{"appearance_zh":"淺稻草色，帶綠色光澤","appearance_en":"Pale straw with green tints","nose_zh":"青草、百香果、柑橘皮、淡淡的燧石礦物味","nose_en":"Cut grass, passionfruit, citrus zest, flinty minerals","palate_zh":"入口清脆，酸度明亮，中等酒體，收尾乾淨清爽","palate_en":"Crisp entry, bright acidity, medium body, clean finish","food_zh":["聚餐","海鮮","沙拉","夏日午後","朋友聚會"],"food_en":["Dinner parties","Seafood","Salads","Summer afternoons"]}',
'馬爾堡羅位於紐西蘭南島的東北端，是全球公認的長相思聖地。這裡日照充足但夜晚涼爽，葡萄可以緩慢成熟，保留住清脆的酸度和豐富的果香。Cloudy Bay 酒莊創立於 1985 年，幾乎憑一己之力讓紐西蘭長相思登上世界舞台。',
'Marlborough sits at the northeastern tip of New Zealand''s South Island and is globally recognized as the spiritual home of Sauvignon Blanc. Long sunshine hours paired with cool nights allow grapes to ripen slowly, preserving crisp acidity and vibrant fruit character.'),
-- 2
('moet-chandon-brut-imperial', 'Moët & Chandon Brut Impérial', 'sparkling', '法國 · 香檳區 · 氣泡酒', 'France · Champagne · Sparkling', 'Chardonnay / Pinot Noir / Pinot Meunier', NULL, '送香檳基本不會出錯。金色酒液、細膩氣泡，任何場合都撐得住場面。', 'You can never go wrong with Champagne. Golden hues, fine bubbles — a gift in itself.', 268, 8, '🥂', NULL, true,
'{"appearance_zh":"金黃色，氣泡細膩持久","appearance_en":"Golden yellow with fine persistent bubbles","nose_zh":"白花、柑橘、烤杏仁","nose_en":"White flowers, citrus, toasted almonds","palate_zh":"優雅豐富，果味與礦物感平衡","palate_en":"Elegant and rich, balanced fruit and mineral notes","food_zh":["慶祝","開胃菜","海鮮拼盤"],"food_en":["Celebrations","Appetizers","Seafood platters"]}',
'香檳區位於巴黎東北方約 150 公里，是法國最北的葡萄酒產區。Moët & Chandon 創立於 1743 年，是全球最知名的香檳品牌之一。',
'The Champagne region lies about 150km northeast of Paris and is France''s northernmost wine region. Moët & Chandon, founded in 1743, is one of the world''s most iconic Champagne houses.'),
-- 3
('whispering-angel-rose-2023', 'Whispering Angel Rosé 2023', 'rosé', '法國 · 普羅旺斯 · 粉紅酒', 'France · Provence · Rosé', 'Grenache / Cinsault / Rolle', 2023, '淡粉色的瓶身已經贏了一半。清爽的草莓和白桃香氣，冰鎮後配沙拉最棒。', 'The pale pink bottle is half the charm. Fresh strawberry and white peach aromas — pure summer.', 198, 5, '🍷', NULL, true,
'{"appearance_zh":"淡三文魚粉色","appearance_en":"Pale salmon pink","nose_zh":"草莓、白桃、柑橘花","nose_en":"Strawberry, white peach, citrus blossom","palate_zh":"清爽圓潤，微微礦物感","palate_en":"Fresh and round with subtle minerality","food_zh":["沙拉","海鮮","戶外野餐"],"food_en":["Salads","Seafood","Outdoor picnics"]}',
'普羅旺斯是全球粉紅酒的標杆產區，地中海氣候賦予葡萄完美的成熟度和清爽的酸度。',
'Provence is the benchmark region for rosé worldwide. The Mediterranean climate provides perfect grape ripeness with refreshing acidity.'),
-- 4
('penfolds-bin-389-2021', 'Penfolds Bin 389 2021', 'red', '澳洲 · 南澳 · 紅酒', 'Australia · South Australia · Red', 'Cabernet Sauvignon / Shiraz', 2021, '澳洲紅酒的經典代表，果味濃郁但不失結構，配牛排最對味。', 'A classic Australian red — rich fruit with good structure. Perfect with steak.', 328, 7, '🍷', NULL, false,
'{"appearance_zh":"深紅寶石色","appearance_en":"Deep ruby red","nose_zh":"黑醋栗、巧克力、香草","nose_en":"Blackcurrant, chocolate, vanilla","palate_zh":"飽滿濃郁，單寧成熟，餘韻悠長","palate_en":"Full and rich, ripe tannins, long finish","food_zh":["牛排","燒烤","硬質芝士"],"food_en":["Steak","BBQ","Hard cheese"]}',
'南澳是澳洲最重要的葡萄酒產區，以溫暖乾燥的氣候著稱。Penfolds 是澳洲最受尊崇的酒莊之一。',
'South Australia is Australia''s most important wine region, known for its warm, dry climate. Penfolds is one of Australia''s most revered wineries.'),
-- 5
('masi-costasera-amarone-2018', 'Masi Costasera Amarone 2018', 'red', '意大利 · 威尼托 · 紅酒', 'Italy · Veneto · Red', 'Corvina / Rondinella / Molinara', 2018, '意大利經典風乾葡萄釀造，濃郁醇厚，適合冬天慢慢品嚐。', 'Classic Italian Amarone made from dried grapes — rich and warming, perfect for winter evenings.', 388, 4, '🍾', NULL, false,
'{"appearance_zh":"深石榴紅色","appearance_en":"Deep garnet red","nose_zh":"乾果、可可、菸草、香料","nose_en":"Dried fruit, cocoa, tobacco, spices","palate_zh":"濃郁豐厚，帶甜美果味，餘韻帶杏仁苦味","palate_en":"Rich and velvety, sweet fruit flavors, almond-bitter finish","food_zh":["燉肉","野味","陳年芝士"],"food_en":["Stewed meats","Game","Aged cheese"]}',
'威尼托位於意大利東北部，Amarone 是該產區最珍貴的酒款，使用風乾數月的葡萄釀造，風味極為濃縮。',
'Veneto is in northeastern Italy. Amarone is the region''s most prized wine, made from grapes dried for months to concentrate their flavors.'),
-- 6
('santa-margherita-pinot-grigio', 'Santa Margherita Pinot Grigio', 'white', '意大利 · 特倫蒂諾 · 白酒', 'Italy · Trentino · White', 'Pinot Grigio', NULL, '清爽百搭的意大利白酒，不管配什麼菜都不會出錯。', 'A crisp, versatile Italian white that goes with just about anything.', 168, 5, '🥂', NULL, false,
'{"appearance_zh":"淺稻草色","appearance_en":"Pale straw","nose_zh":"青蘋果、白花、礦物","nose_en":"Green apple, white flowers, minerals","palate_zh":"清脆乾爽，酸度適中","palate_en":"Crisp and dry, moderate acidity","food_zh":["意麵","沙拉","白肉"],"food_en":["Pasta","Salads","White meat"]}',
'特倫蒂諾位於意大利北部阿爾卑斯山腳，涼爽的氣候讓白葡萄保留了清新的果味和酸度。',
'Trentino sits at the foot of the Alps in northern Italy. The cool climate preserves fresh fruit flavors and acidity in white grapes.'),
-- 7
('chateau-mouton-rothschild-2018', 'Château Mouton Rothschild 2018', 'red', '法國 · 波爾多 · 紅酒', 'France · Bordeaux · Red', 'Cabernet Sauvignon / Merlot', 2018, '波爾多五大名莊之一，2018 年份被譽為完美年份，收藏或品飲皆宜。', 'One of Bordeaux''s First Growths — the 2018 vintage is considered near-perfect for cellaring or drinking.', 4800, 3, '🍷', 'Collector', false,
'{"appearance_zh":"深紫紅色","appearance_en":"Deep purple-red","nose_zh":"黑醋栗、雪松、石墨、紫羅蘭","nose_en":"Blackcurrant, cedar, graphite, violets","palate_zh":"宏大而精細，單寧如絲般細膩","palate_en":"Grand yet refined, silky tannins","food_zh":["羊排","松露料理","陳年芝士"],"food_en":["Lamb chops","Truffle dishes","Aged cheese"]}', NULL, NULL),
-- 8
('opus-one-2019', 'Opus One 2019', 'red', '美國 · 納帕谷 · 紅酒', 'USA · Napa Valley · Red', 'Cabernet Sauvignon / Merlot / Cab Franc', 2019, '納帕谷殿堂級名莊，法美合作的結晶，優雅而不失力量。', 'A legendary Napa Valley estate — the Franco-American collaboration that redefined California wine.', 3200, 4, '🍷', 'Premium', false,
'{"appearance_zh":"深寶石紅","appearance_en":"Deep ruby","nose_zh":"黑莓、紫羅蘭、可可、月桂","nose_en":"Blackberry, violet, cocoa, bay laurel","palate_zh":"絲滑豐滿，層次複雜","palate_en":"Silky and full, complex layers","food_zh":["牛排","燉牛尾","黑松露"],"food_en":["Steak","Braised oxtail","Black truffle"]}', NULL, NULL),
-- 9
('louis-roederer-cristal-2015', 'Louis Roederer Cristal 2015', 'sparkling', '法國 · 香檳區 · 氣泡酒', 'France · Champagne · Sparkling', 'Pinot Noir / Chardonnay', 2015, '頂級年份香檳代表，為沙皇而生。極致細膩的氣泡和深邃的風味。', 'The pinnacle of prestige Champagne, originally created for the Tsar. Exquisite bubbles and profound depth.', 2800, 3, '🥂', 'Luxury', false,
'{"appearance_zh":"閃耀金黃色","appearance_en":"Brilliant gold","nose_zh":"榛子、柑橘蜜、白花、粉筆","nose_en":"Hazelnut, citrus honey, white flowers, chalk","palate_zh":"極其精緻，奶油般質地，無盡餘韻","palate_en":"Extremely refined, creamy texture, endless finish","food_zh":["魚子醬","龍蝦","精緻法餐"],"food_en":["Caviar","Lobster","Fine French cuisine"]}', NULL, NULL),
-- 10
('veuve-clicquot-yellow-label', 'Veuve Clicquot Yellow Label', 'sparkling', '法國 · 香檳區 · 氣泡酒', 'France · Champagne · Sparkling', 'Pinot Noir / Chardonnay / Pinot Meunier', NULL, '黃牌香檳辨識度超高，果味豐富，慶祝場合的首選。', 'The iconic yellow label — rich, fruit-forward Champagne that''s perfect for celebrations.', 328, 6, '🥂', NULL, false,
'{"appearance_zh":"金黃色","appearance_en":"Golden yellow","nose_zh":"烤面包、杏桃、香草","nose_en":"Toasted bread, apricot, vanilla","palate_zh":"豐富圓潤，氣泡活潑","palate_en":"Rich and round, lively bubbles","food_zh":["慶祝","開胃菜","壽司"],"food_en":["Celebrations","Appetizers","Sushi"]}', NULL, NULL),
-- 11
('dom-perignon-2013', 'Dom Pérignon 2013', 'sparkling', '法國 · 香檳區 · 氣泡酒', 'France · Champagne · Sparkling', 'Chardonnay / Pinot Noir', 2013, '香檳之王，每個年份都是藝術品。2013 年清新而精確，展現極致平衡。', 'The King of Champagne — every vintage is a work of art. The 2013 is fresh, precise, and supremely balanced.', 1880, 4, '🥂', 'Icon', false,
'{"appearance_zh":"明亮金黃","appearance_en":"Bright golden","nose_zh":"白花、柑橘、杏仁、輕煙燻","nose_en":"White flowers, citrus, almonds, light smoke","palate_zh":"精準有力，極致平衡","palate_en":"Precise and powerful, supreme balance","food_zh":["精緻海鮮","日本料理","慶典"],"food_en":["Fine seafood","Japanese cuisine","Celebrations"]}', NULL, NULL),
-- 12
('marlborough-villa-maria-sauvignon-blanc-2023', 'Villa Maria Sauvignon Blanc 2023', 'white', '紐西蘭 · 馬爾堡羅 · 白酒', 'New Zealand · Marlborough · White', 'Sauvignon Blanc', 2023, '馬爾堡羅另一經典白酒，百香果和青椒香氣特別鮮明，CP值超高。', 'Another Marlborough classic — vibrant passionfruit and capsicum notes with excellent value.', 98, 5, '🍾', 'Best Value', false,
'{"appearance_zh":"淺黃綠色","appearance_en":"Pale yellow-green","nose_zh":"百香果、青椒、葡萄柚","nose_en":"Passionfruit, capsicum, grapefruit","palate_zh":"多汁清脆，酸度活潑","palate_en":"Juicy and crisp, vibrant acidity","food_zh":["海鮮","亞洲菜","沙拉"],"food_en":["Seafood","Asian cuisine","Salads"]}', NULL, NULL),
-- 13
('chablis-william-fevre-2022', 'William Fèvre Chablis 2022', 'white', '法國 · 勃艮第 · 白酒', 'France · Burgundy · White', 'Chardonnay', 2022, '夏布利的礦物感白酒代表，清冽如泉水，配生蠔絕配。', 'The quintessential mineral-driven Chablis — as clear as spring water, sublime with oysters.', 228, 4, '🍾', NULL, false,
'{"appearance_zh":"淺金色","appearance_en":"Pale gold","nose_zh":"燧石、青蘋果、檸檬","nose_en":"Flint, green apple, lemon","palate_zh":"礦物感突出，酸度清冽","palate_en":"Pronounced minerality, bracing acidity","food_zh":["生蠔","白灼蝦","壽司"],"food_en":["Oysters","Poached prawns","Sushi"]}', NULL, NULL),
-- 14
('sancerre-pascal-jolivet-2022', 'Pascal Jolivet Sancerre 2022', 'white', '法國 · 盧瓦爾河谷 · 白酒', 'France · Loire Valley · White', 'Sauvignon Blanc', 2022, '法國長相思的正宗風味，比紐西蘭的更含蓄，帶燧石和白花香氣。', 'The French take on Sauvignon Blanc — more restrained than New Zealand, with flint and white flower notes.', 248, 3, '🍾', NULL, false,
'{"appearance_zh":"透亮銀黃色","appearance_en":"Bright silver-yellow","nose_zh":"白花、燧石、柑橘","nose_en":"White flowers, flint, citrus","palate_zh":"含蓄優雅，礦物感細膩","palate_en":"Restrained elegance, fine minerality","food_zh":["山羊芝士","白肉","沙拉"],"food_en":["Goat cheese","White meat","Salads"]}', NULL, NULL),
-- 15
('riesling-dr-loosen-2022', 'Dr. Loosen Riesling 2022', 'white', '德國 · 摩澤爾 · 白酒', 'Germany · Mosel · White', 'Riesling', 2022, '德國摩澤爾的經典雷司令，微甜帶酸，像喝礦泉水一樣清新。酒精度低，適合不愛太酒味的人。', 'Classic Mosel Riesling — off-dry with racy acidity, fresh as mineral water. Low alcohol, perfect for those who prefer lighter wines.', 158, 5, '🍾', NULL, false,
'{"appearance_zh":"淡檸檬色","appearance_en":"Pale lemon","nose_zh":"青蘋果、蜂蜜、白桃、板岩","nose_en":"Green apple, honey, white peach, slate","palate_zh":"微甜清爽，酸甜平衡完美","palate_en":"Off-dry and fresh, perfect sweet-acid balance","food_zh":["亞洲菜","辣菜","甜品"],"food_en":["Asian food","Spicy dishes","Desserts"]}', NULL, NULL),
-- 16
('gewurztraminer-trimbach-2020', 'Trimbach Gewürztraminer 2020', 'white', '法國 · 阿爾薩斯 · 白酒', 'France · Alsace · White', 'Gewürztraminer', 2020, '阿爾薩斯的招牌品種，荔枝和玫瑰花瓣香氣撲鼻，配中菜特別好。', 'Alsace''s signature grape — intoxicating lychee and rose petal aromas. Superb with Chinese cuisine.', 218, 3, '🍾', NULL, false,
'{"appearance_zh":"深金黃色","appearance_en":"Deep golden","nose_zh":"荔枝、玫瑰、生薑、蜂蜜","nose_en":"Lychee, rose, ginger, honey","palate_zh":"芳香豐富，微甜圓潤","palate_en":"Aromatic and rich, off-dry and round","food_zh":["中菜","咖喱","泰國菜","鵝肝"],"food_en":["Chinese food","Curry","Thai food","Foie gras"]}', NULL, NULL),
-- 17
('chateau-dereszla-tokaji-5-puttonyos-2017', 'Château Dereszla Tokaji 5 Puttonyos 2017', 'dessert', '匈牙利 · 托卡伊 · 甜酒', 'Hungary · Tokaj · Dessert', 'Furmint / Hárslevelű', 2017, '匈牙利國寶級甜酒，蜂蜜和杏桃的極致甜蜜，配甜品或單獨品嚐都好。', 'Hungary''s national treasure — honey and apricot sweetness, wonderful with desserts or on its own.', 348, 3, '🍾', NULL, false,
'{"appearance_zh":"深琥珀金色","appearance_en":"Deep amber gold","nose_zh":"蜂蜜、杏桃、橙皮、焦糖","nose_en":"Honey, apricot, orange peel, caramel","palate_zh":"甜美而不膩，酸度平衡","palate_en":"Sweet but not cloying, balanced acidity","food_zh":["甜品","藍紋芝士","水果塔"],"food_en":["Desserts","Blue cheese","Fruit tarts"]}', NULL, NULL),
-- 18
('chateau-dyquem-2017', 'Château d''Yquem 2017', 'dessert', '法國 · 波爾多蘇玳 · 甜酒', 'France · Bordeaux Sauternes · Dessert', 'Sémillon / Sauvignon Blanc', 2017, '世界最頂級的貴腐甜酒，液態黃金般的存在。每一口都是奢華的享受。', 'The world''s greatest sweet wine — liquid gold. Every sip is pure luxury.', 3500, 2, '🍾', 'Legendary', false,
'{"appearance_zh":"深金黃色","appearance_en":"Deep gold","nose_zh":"蜂蜜、杏桃、番紅花、焦糖","nose_en":"Honey, apricot, saffron, caramel","palate_zh":"極致豐富，完美平衡甜與酸","palate_en":"Supremely rich, perfect sweet-acid balance","food_zh":["鵝肝","藍紋芝士","法式甜點"],"food_en":["Foie gras","Blue cheese","French pastry"]}', NULL, NULL),
-- 19
('tignanello-2020', 'Tignanello 2020', 'red', '意大利 · 托斯卡納 · 紅酒', 'Italy · Tuscany · Red', 'Sangiovese / Cabernet Sauvignon', 2020, '超級托斯卡納的先驅，打破傳統的叛逆之作。強勁而優雅，意大利紅酒的巔峰之一。', 'The pioneer of Super Tuscans — a rebel that broke traditions. Powerful yet elegant, among Italy''s finest reds.', 688, 4, '🍷', NULL, false,
'{"appearance_zh":"深紅寶石色","appearance_en":"Deep ruby","nose_zh":"黑櫻桃、香料、皮革、可可","nose_en":"Black cherry, spices, leather, cocoa","palate_zh":"強勁優雅，單寧精緻","palate_en":"Powerful yet elegant, refined tannins","food_zh":["燉肉","牛排","硬質芝士"],"food_en":["Braised meats","Steak","Hard cheese"]}', NULL, NULL),
-- 20
('barolo-pio-cesare-2018', 'Pio Cesare Barolo 2018', 'red', '意大利 · 皮埃蒙特 · 紅酒', 'Italy · Piedmont · Red', 'Nebbiolo', 2018, '意大利酒王 Barolo，需要時間來展現魅力。玫瑰花瓣、焦油和松露的複雜香氣。', 'The ''King of Italian wines'' — Barolo needs time to reveal its charm. Complex aromas of rose petal, tar, and truffle.', 528, 3, '🍷', NULL, false,
'{"appearance_zh":"淺石榴紅","appearance_en":"Pale garnet","nose_zh":"玫瑰、焦油、松露、甘草","nose_en":"Rose, tar, truffle, licorice","palate_zh":"單寧強勁但優雅，酸度活潑","palate_en":"Firm but elegant tannins, lively acidity","food_zh":["松露料理","燉肉","陳年芝士"],"food_en":["Truffle dishes","Braised meats","Aged cheese"]}', NULL, NULL),
-- 21
('rioja-marques-de-riscal-reserva-2018', 'Marqués de Riscal Reserva 2018', 'red', '西班牙 · 里奧哈 · 紅酒', 'Spain · Rioja · Red', 'Tempranillo', 2018, '西班牙里奧哈的經典陳年紅酒，溫和易飲，帶皮革和香料氣息。性價比極高。', 'A classic aged Rioja — smooth and approachable with leather and spice notes. Exceptional value.', 178, 5, '🍷', 'Best Value', false,
'{"appearance_zh":"中等紅寶石色","appearance_en":"Medium ruby","nose_zh":"紅莓、皮革、香草、菸草","nose_en":"Red berries, leather, vanilla, tobacco","palate_zh":"溫和圓潤，橡木味恰到好處","palate_en":"Smooth and round, well-judged oak","food_zh":["西班牙火腿","烤肉","中等硬度芝士"],"food_en":["Jamon","Grilled meats","Semi-hard cheese"]}', NULL, NULL),
-- 22
('malbec-catena-zapata-2021', 'Catena Zapata Malbec 2021', 'red', '阿根廷 · 門多薩 · 紅酒', 'Argentina · Mendoza · Red', 'Malbec', 2021, '阿根廷最好的馬爾貝克之一，紫色花香混合深色水果，口感厚實柔滑。', 'One of Argentina''s finest Malbecs — purple florals with dark fruit, thick and silky on the palate.', 298, 4, '🍷', NULL, false,
'{"appearance_zh":"深紫紅色","appearance_en":"Deep purple-red","nose_zh":"紫羅蘭、黑莓、李子、可可","nose_en":"Violet, blackberry, plum, cocoa","palate_zh":"厚實柔滑，單寧甜美","palate_en":"Thick and silky, sweet tannins","food_zh":["燒烤","牛肉","濃味菜式"],"food_en":["BBQ","Beef","Rich dishes"]}', NULL, NULL),
-- 23
('pinot-noir-felton-road-2022', 'Felton Road Pinot Noir 2022', 'red', '紐西蘭 · 中部奧塔哥 · 紅酒', 'New Zealand · Central Otago · Red', 'Pinot Noir', 2022, '紐西蘭頂級黑皮諾，來自全世界最南端的產區。紅果香氣和絲般質地。', 'Top-tier New Zealand Pinot Noir from the world''s southernmost wine region. Red fruit and silky texture.', 438, 3, '🍷', NULL, false,
'{"appearance_zh":"透亮紅寶石色","appearance_en":"Bright ruby","nose_zh":"紅櫻桃、覆盆子、香料、泥土","nose_en":"Red cherry, raspberry, spice, earth","palate_zh":"絲般質地，優雅精緻","palate_en":"Silky texture, elegant and refined","food_zh":["鴨肉","三文魚","蘑菇料理"],"food_en":["Duck","Salmon","Mushroom dishes"]}', NULL, NULL),
-- 24
('burgundy-louis-jadot-bourgogne-2021', 'Louis Jadot Bourgogne Pinot Noir 2021', 'red', '法國 · 勃艮第 · 紅酒', 'France · Burgundy · Red', 'Pinot Noir', 2021, '入門級勃艮第紅酒，讓你用親民價格感受黑皮諾的優雅。紅果香和輕盈酒體。', 'Entry-level Burgundy — experience Pinot Noir elegance at an approachable price. Red fruit and light body.', 198, 5, '🍷', NULL, false,
'{"appearance_zh":"淺紅寶石色","appearance_en":"Light ruby","nose_zh":"紅櫻桃、草莓、花香","nose_en":"Red cherry, strawberry, floral","palate_zh":"輕盈優雅，果味純淨","palate_en":"Light and elegant, pure fruit","food_zh":["家禽","蘑菇","輕食"],"food_en":["Poultry","Mushrooms","Light dishes"]}', NULL, NULL),
-- 25
('prosecco-la-marca', 'La Marca Prosecco', 'sparkling', '意大利 · 威尼托 · 氣泡酒', 'Italy · Veneto · Sparkling', 'Glera', NULL, '意大利國民氣泡酒，青蘋果和蜂蜜的清新香氣。價格親民，適合隨時開一瓶。', 'Italy''s favorite sparkling — fresh green apple and honey notes. Affordable enough to pop open anytime.', 98, 6, '🥂', 'Best Value', false,
'{"appearance_zh":"淺稻草色","appearance_en":"Pale straw","nose_zh":"青蘋果、蜂蜜、白花","nose_en":"Green apple, honey, white flowers","palate_zh":"清新活潑，微甜順口","palate_en":"Fresh and lively, slightly sweet","food_zh":["開胃菜","輕食","早午餐"],"food_en":["Appetizers","Light bites","Brunch"]}', NULL, NULL),
-- 26
('gruner-veltliner-laurenz-v-2022', 'Laurenz V Grüner Veltliner 2022', 'white', '奧地利 · 坎普谷 · 白酒', 'Austria · Kamptal · White', 'Grüner Veltliner', 2022, '奧地利的國民白葡萄，白胡椒和柑橘的獨特組合。超百搭，特別適合亞洲菜。', 'Austria''s signature white grape — unique white pepper and citrus combo. Incredibly versatile, especially with Asian food.', 168, 3, '🍾', NULL, false,
'{"appearance_zh":"淺黃綠色","appearance_en":"Pale yellow-green","nose_zh":"白胡椒、柑橘、青草","nose_en":"White pepper, citrus, fresh herbs","palate_zh":"清爽多汁，有咬口感","palate_en":"Fresh and juicy with a savory bite","food_zh":["亞洲菜","壽司","沙拉","雞肉"],"food_en":["Asian food","Sushi","Salads","Chicken"]}', NULL, NULL),
-- 27
('cote-du-rhone-guigal-2020', 'E. Guigal Côtes du Rhône 2020', 'red', '法國 · 隆河谷 · 紅酒', 'France · Rhône Valley · Red', 'Grenache / Syrah / Mourvèdre', 2020, '南法經典混釀，果味奔放，香料氣息豐富。價格親民但品質穩定，日常餐酒首選。', 'A classic Southern Rhône blend — exuberant fruit with rich spice notes. Affordable yet consistent — an everyday wine staple.', 128, 6, '🍷', NULL, false,
'{"appearance_zh":"深紅寶石色","appearance_en":"Deep ruby","nose_zh":"紅莓、黑胡椒、百里香","nose_en":"Red berries, black pepper, thyme","palate_zh":"果味奔放，香料味突出","palate_en":"Exuberant fruit, prominent spice","food_zh":["燒烤","燉菜","披薩"],"food_en":["BBQ","Stews","Pizza"]}', NULL, NULL),
-- 28
('chianti-classico-castello-di-ama-2020', 'Castello di Ama Chianti Classico 2020', 'red', '意大利 · 托斯卡納 · 紅酒', 'Italy · Tuscany · Red', 'Sangiovese', 2020, '經典奇安提，酸度活潑，帶櫻桃和草本香氣。配意大利菜天生一對。', 'Classic Chianti with lively acidity, cherry and herbal notes. Born to pair with Italian food.', 228, 4, '🍷', NULL, false,
'{"appearance_zh":"明亮紅寶石色","appearance_en":"Bright ruby","nose_zh":"酸櫻桃、百里香、泥土","nose_en":"Sour cherry, thyme, earth","palate_zh":"酸度活潑，單寧中等","palate_en":"Lively acidity, medium tannins","food_zh":["意大利麵","披薩","烤蔬菜"],"food_en":["Pasta","Pizza","Roasted vegetables"]}', NULL, NULL),
-- 29
('port-tawny-10-year-grahams', 'Graham''s 10 Year Tawny Port', 'dessert', '葡萄牙 · 杜羅河 · 加強酒', 'Portugal · Douro · Fortified', 'Touriga Nacional / Tinta Roriz', NULL, '陳年茶色波特酒，焦糖、堅果和太妃糖的迷人風味。餐後酒的完美選擇。', 'Aged tawny Port with caramel, nut, and toffee flavors. The perfect after-dinner wine.', 268, 3, '🍾', NULL, false,
'{"appearance_zh":"琥珀色","appearance_en":"Amber","nose_zh":"焦糖、核桃、太妃糖、橙皮","nose_en":"Caramel, walnut, toffee, orange peel","palate_zh":"甜潤柔滑，堅果味悠長","palate_en":"Sweet and silky, lingering nutty finish","food_zh":["甜品","堅果","巧克力","芝士"],"food_en":["Desserts","Nuts","Chocolate","Cheese"]}', NULL, NULL),
-- 30
('champagne-laurent-perrier-rose', 'Laurent-Perrier Cuvée Rosé', 'sparkling', '法國 · 香檳區 · 粉紅氣泡酒', 'France · Champagne · Rosé Sparkling', 'Pinot Noir', NULL, '粉紅香檳的標桿之作，全球最受歡迎的粉紅香檳之一。草莓和紅醋栗的優雅氣息。', 'The benchmark rosé Champagne — one of the world''s most popular. Elegant strawberry and redcurrant notes.', 488, 4, '🥂', NULL, false,
'{"appearance_zh":"三文魚粉色","appearance_en":"Salmon pink","nose_zh":"草莓、紅醋栗、玫瑰","nose_en":"Strawberry, redcurrant, rose","palate_zh":"細膩活潑，果味優雅","palate_en":"Delicate and lively, elegant fruit","food_zh":["海鮮","壽司","莓果甜品"],"food_en":["Seafood","Sushi","Berry desserts"]}', NULL, NULL),
-- 31
('shiraz-penfolds-max-2021', 'Penfolds Max''s Shiraz 2021', 'red', '澳洲 · 南澳 · 紅酒', 'Australia · South Australia · Red', 'Shiraz', 2021, 'Penfolds 入門級設拉子，黑莓和巧克力的豐富風味。比 Bin 389 更平易近人的選擇。', 'Penfolds'' entry-level Shiraz — rich blackberry and chocolate flavors. More approachable than Bin 389.', 198, 5, '🍷', NULL, false,
'{"appearance_zh":"深紫紅色","appearance_en":"Deep purple-red","nose_zh":"黑莓、巧克力、黑胡椒","nose_en":"Blackberry, chocolate, black pepper","palate_zh":"果味豐富，單寧柔順","palate_en":"Rich fruit, soft tannins","food_zh":["燒烤","漢堡","燉肉"],"food_en":["BBQ","Burgers","Stews"]}', NULL, NULL),
-- 32
('albarino-martin-codax-2023', 'Martín Códax Albariño 2023', 'white', '西班牙 · 下海灣 · 白酒', 'Spain · Rías Baixas · White', 'Albariño', 2023, '西班牙加利西亞的海風白酒，帶明顯的海洋礦物感和柑橘香氣。配海鮮天作之合。', 'A sea-breeze white from Galicia — pronounced marine minerality and citrus. A natural match for seafood.', 148, 4, '🍾', NULL, false,
'{"appearance_zh":"淺金色帶綠光","appearance_en":"Pale gold with green tints","nose_zh":"柑橘、白桃、海風、礦物","nose_en":"Citrus, white peach, sea breeze, minerals","palate_zh":"清爽鹹鮮，礦物感突出","palate_en":"Fresh and saline, prominent minerality","food_zh":["海鮮","壽司","白灼蝦"],"food_en":["Seafood","Sushi","Poached prawns"]}', NULL, NULL);

-- ============================================================
-- Tags
-- ============================================================
INSERT INTO tags (slug, name_zh, name_en) VALUES
('easy-drinking', '清爽易飲', 'Easy drinking'),
('seafood-pairing', '適合配海鮮', 'Pairs with seafood'),
('beginner-friendly', '新手友好', 'Beginner-friendly'),
('gift', '送禮首選', 'Great for gifting'),
('crowd-pleaser', '開瓶就有儀式感', 'Crowd-pleaser'),
('summer', '夏天喝很爽', 'Summer favourite'),
('instagram', '拍照好看', 'Instagram-worthy'),
('no-fail', '不踩雷', 'Reliable pick'),
('red-meat', '適合配紅肉', 'Pairs with red meat'),
('great-value', '性價比高', 'Great value'),
('rich-fruit', '果香豐富', 'Rich fruit'),
('winter', '適合冬天', 'Winter wine'),
('versatile', '百搭', 'Versatile'),
('collector', '值得收藏', 'Worth collecting'),
('premium', '頂級之選', 'Premium pick'),
('asian-food', '適合配中菜', 'Pairs with Asian food'),
('celebration', '適合慶祝', 'Perfect for celebrations'),
('after-dinner', '餐後酒', 'After-dinner wine'),
('light-body', '輕盈好入口', 'Light-bodied'),
('full-body', '酒體飽滿', 'Full-bodied');

-- ============================================================
-- Wine-Tag associations (representative sample)
-- ============================================================
INSERT INTO wine_tags (wine_id, tag_id)
SELECT w.id, t.id FROM wines w, tags t WHERE w.slug = 'cloudy-bay-sauvignon-blanc-2023' AND t.slug IN ('easy-drinking','seafood-pairing','beginner-friendly');
INSERT INTO wine_tags (wine_id, tag_id)
SELECT w.id, t.id FROM wines w, tags t WHERE w.slug = 'moet-chandon-brut-imperial' AND t.slug IN ('gift','crowd-pleaser','celebration');
INSERT INTO wine_tags (wine_id, tag_id)
SELECT w.id, t.id FROM wines w, tags t WHERE w.slug = 'whispering-angel-rose-2023' AND t.slug IN ('summer','instagram','no-fail');
INSERT INTO wine_tags (wine_id, tag_id)
SELECT w.id, t.id FROM wines w, tags t WHERE w.slug = 'penfolds-bin-389-2021' AND t.slug IN ('red-meat','great-value','full-body');
INSERT INTO wine_tags (wine_id, tag_id)
SELECT w.id, t.id FROM wines w, tags t WHERE w.slug = 'masi-costasera-amarone-2018' AND t.slug IN ('rich-fruit','winter','full-body');
INSERT INTO wine_tags (wine_id, tag_id)
SELECT w.id, t.id FROM wines w, tags t WHERE w.slug = 'santa-margherita-pinot-grigio' AND t.slug IN ('easy-drinking','versatile','light-body');

-- ============================================================
-- Merchant Prices (sample for several wines)
-- ============================================================
-- Cloudy Bay
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 138, true FROM wines w, merchants m WHERE w.slug = 'cloudy-bay-sauvignon-blanc-2023' AND m.slug = 'watsons-wine';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 155, false FROM wines w, merchants m WHERE w.slug = 'cloudy-bay-sauvignon-blanc-2023' AND m.slug = 'wine-and-co';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 168, false FROM wines w, merchants m WHERE w.slug = 'cloudy-bay-sauvignon-blanc-2023' AND m.slug = 'cellardoor';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 172, false FROM wines w, merchants m WHERE w.slug = 'cloudy-bay-sauvignon-blanc-2023' AND m.slug = 'vinhk';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 185, false FROM wines w, merchants m WHERE w.slug = 'cloudy-bay-sauvignon-blanc-2023' AND m.slug = 'grape-hk';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 198, false FROM wines w, merchants m WHERE w.slug = 'cloudy-bay-sauvignon-blanc-2023' AND m.slug = 'bottleshop';

-- Penfolds Bin 389
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 328, true FROM wines w, merchants m WHERE w.slug = 'penfolds-bin-389-2021' AND m.slug = 'grape-hk';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 348, false FROM wines w, merchants m WHERE w.slug = 'penfolds-bin-389-2021' AND m.slug = 'watsons-wine';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 358, false FROM wines w, merchants m WHERE w.slug = 'penfolds-bin-389-2021' AND m.slug = 'cellardoor';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 368, false FROM wines w, merchants m WHERE w.slug = 'penfolds-bin-389-2021' AND m.slug = 'wine-and-co';

-- Moët & Chandon
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 268, true FROM wines w, merchants m WHERE w.slug = 'moet-chandon-brut-imperial' AND m.slug = 'watsons-wine';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 288, false FROM wines w, merchants m WHERE w.slug = 'moet-chandon-brut-imperial' AND m.slug = 'wine-and-co';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 298, false FROM wines w, merchants m WHERE w.slug = 'moet-chandon-brut-imperial' AND m.slug = 'grape-hk';

-- Whispering Angel
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 198, true FROM wines w, merchants m WHERE w.slug = 'whispering-angel-rose-2023' AND m.slug = 'cellardoor';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 218, false FROM wines w, merchants m WHERE w.slug = 'whispering-angel-rose-2023' AND m.slug = 'watsons-wine';
INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best)
SELECT w.id, m.id, 228, false FROM wines w, merchants m WHERE w.slug = 'whispering-angel-rose-2023' AND m.slug = 'bottleshop';

-- ============================================================
-- Scene-Wine associations
-- ============================================================
-- Gift scene
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 1 FROM scenes s, wines w WHERE s.slug = 'gift' AND w.slug = 'moet-chandon-brut-imperial';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 2 FROM scenes s, wines w WHERE s.slug = 'gift' AND w.slug = 'dom-perignon-2013';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 3 FROM scenes s, wines w WHERE s.slug = 'gift' AND w.slug = 'louis-roederer-cristal-2015';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 4 FROM scenes s, wines w WHERE s.slug = 'gift' AND w.slug = 'champagne-laurent-perrier-rose';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 5 FROM scenes s, wines w WHERE s.slug = 'gift' AND w.slug = 'opus-one-2019';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 6 FROM scenes s, wines w WHERE s.slug = 'gift' AND w.slug = 'chateau-dyquem-2017';

-- Dinner scene
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 1 FROM scenes s, wines w WHERE s.slug = 'dinner' AND w.slug = 'cloudy-bay-sauvignon-blanc-2023';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 2 FROM scenes s, wines w WHERE s.slug = 'dinner' AND w.slug = 'penfolds-bin-389-2021';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 3 FROM scenes s, wines w WHERE s.slug = 'dinner' AND w.slug = 'gewurztraminer-trimbach-2020';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 4 FROM scenes s, wines w WHERE s.slug = 'dinner' AND w.slug = 'rioja-marques-de-riscal-reserva-2018';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 5 FROM scenes s, wines w WHERE s.slug = 'dinner' AND w.slug = 'chianti-classico-castello-di-ama-2020';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 6 FROM scenes s, wines w WHERE s.slug = 'dinner' AND w.slug = 'cote-du-rhone-guigal-2020';

-- Everyday scene
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 1 FROM scenes s, wines w WHERE s.slug = 'everyday' AND w.slug = 'marlborough-villa-maria-sauvignon-blanc-2023';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 2 FROM scenes s, wines w WHERE s.slug = 'everyday' AND w.slug = 'prosecco-la-marca';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 3 FROM scenes s, wines w WHERE s.slug = 'everyday' AND w.slug = 'santa-margherita-pinot-grigio';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 4 FROM scenes s, wines w WHERE s.slug = 'everyday' AND w.slug = 'cote-du-rhone-guigal-2020';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 5 FROM scenes s, wines w WHERE s.slug = 'everyday' AND w.slug = 'shiraz-penfolds-max-2021';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 6 FROM scenes s, wines w WHERE s.slug = 'everyday' AND w.slug = 'burgundy-louis-jadot-bourgogne-2021';

-- Explore scene
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 1 FROM scenes s, wines w WHERE s.slug = 'explore' AND w.slug = 'gruner-veltliner-laurenz-v-2022';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 2 FROM scenes s, wines w WHERE s.slug = 'explore' AND w.slug = 'riesling-dr-loosen-2022';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 3 FROM scenes s, wines w WHERE s.slug = 'explore' AND w.slug = 'chateau-dereszla-tokaji-5-puttonyos-2017';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 4 FROM scenes s, wines w WHERE s.slug = 'explore' AND w.slug = 'albarino-martin-codax-2023';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 5 FROM scenes s, wines w WHERE s.slug = 'explore' AND w.slug = 'masi-costasera-amarone-2018';
INSERT INTO scene_wines (scene_id, wine_id, sort_order)
SELECT s.id, w.id, 6 FROM scenes s, wines w WHERE s.slug = 'explore' AND w.slug = 'barolo-pio-cesare-2018';
