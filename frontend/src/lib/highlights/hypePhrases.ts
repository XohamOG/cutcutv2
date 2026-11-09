/**
 * What people say or type at big moments, in English, Hinglish and Hindi script.
 *
 * Almost everything is two or more words, because one common word ("bhai", "wow", "crazy")
 * shows up in ordinary talk and would make every moment look like a highlight. Single words
 * are here only when nobody says them calmly. Spelling variants are handled by the matcher in
 * moments.ts, so add a phrase once, in its usual spelling.
 */
const list = (text: string) => text.split(/[|\n]/).map((p) => p.trim()).filter(Boolean);

const ENGLISH_DISBELIEF = list(`
no way|no shot|no freaking way|no frickin way|no fucking way|no effing way|no way bro|no way dude|no way man|no way that just happened
no way he did that|no way she did that|no way you did that|no way i did that|no way that worked|no way that hit|no way he hit that|no way he missed
no way i missed|no way i made that|no way thats real|no way this is real|no way this is happening|not a chance|thats not possible|that is not possible
thats impossible|impossible bro|how is that possible|how is this possible|how is that even possible|are you kidding|are you kidding me
you gotta be kidding|you gotta be kidding me|you have got to be kidding|you have got to be kidding me|youve got to be kidding me|you cant be serious
are you serious|are you serious right now|are you for real|is this real|is this real life|this cant be real|this cant be happening|this isnt happening
i cant believe|i cant believe it|i cant believe that|i cant believe this|i cant believe what|i cant believe he|i cant believe she|i cant believe you
i dont believe it|i dont believe this|i do not believe it|unbelievable|absolutely unbelievable|simply unbelievable|what just happened|what even was that
what was that|what did i just see|what did i just watch|what did i just do|what did he just do|what did she just do|what did you just do
did that just happen|did that really just happen|did you see that|did you guys see that|did yall see that|chat did you see that|did he just do that
did she just do that|did i just do that|you wont believe|you will not believe|you wont believe what|you cant make this up|cant make this up
never seen that|never seen that before|never seen anything like that|ive never seen that|ive never seen anything like|i have never seen that
how did i miss|how did he miss|how did she miss|how did you miss|how did i die|how did i lose|how did that miss|how did that hit|how did he hit that
how did he survive|how did i survive|how did he see me|how did you do that|how did he do that|how did she do that|how did that happen|how did that work
how is he alive|how am i alive|how is he still alive|how am i still alive|how are we alive|how are we still alive
`);

const ENGLISH_EXCLAMATIONS = list(`
oh my god|oh my gosh|oh my goodness|oh my lord|oh my days|oh my word|oh god|oh god no|oh lord|oh no|oh no no no|oh no way|oh hell no|oh hell yeah
oh shit|oh crap|oh snap|oh damn|oh dear god|oh fuck|oh fuck no|oh fuck yes|omg|omfg|wtf|wth|wtaf|holy shit|holy crap|holy moly|holy cow|holy fuck|holy hell
holy smokes|holy mackerel|holy guacamole|holy moses|holy heck|holy frick|what the hell|what the heck|what the fuck|what the frick|what the actual fuck
what the actual hell|what the fudge|what the flip|what the shit|what the crap|what in the world|what in the hell|what in gods name|what on earth
what in tarnation|what in the actual fuck|what the fuck was that|what the hell was that|what the heck was that|what the fuck just happened
what the hell just happened|what the fuck is that|what the hell is that|what the fuck is going on|what the hell is going on|good lord|good god|good grief
good heavens|dear god|dear lord|sweet jesus|jesus christ|jesus fucking christ|lord have mercy|mother of god|for fucks sake|for gods sake|for the love of god
son of a bitch|son of a gun|motherfucker|mother fucker|bloody hell|bloody brilliant|blimey|crikey|great scott|gee whiz|jeez louise|yikes|whoa whoa whoa|woah woah woah
wow wow wow|wow bro|wow dude|wow man|wow thats|wow that was|wow what a|mamma mia|mama mia|oh mama|oh baby|sheesh|sheesh bro|sheesh man|ayo what|ayo chill
yo what|yo what the|yo what was that|yo thats crazy|yo thats insane|yo no way|yo yo yo|bruh|bruh moment|bruh what|bro what|bro what was that
bro what are you doing|bro what is this|bro no|bro please|bro stop|bro come on|bro i swear|bro im dead|bro chill|bro really|bro actually|dude what|dude no
dude come on|dude stop|dude seriously|man what the|shit shit shit|fuck fuck fuck|no no no|no no no no|please no|please no no|please please please|why why why
why me|why god|why always me|why does this always happen|why did i do that|why would you do that|why would he do that
`);

const ENGLISH_HYPE = list(`
lets go|lets fucking go|lets freaking go|lets frickin go|lets effing go|lets get it|lets go baby|lets go boys|lets go bro|lets go chat|lets go team|lfg|lezgo
come on baby|come on come on|come on please|come on bro|come on man|come on now|yes yes yes|yes sir|yes king|yes queen|hell yeah|hell yes|fuck yeah|fuck yes|heck yeah
oh yeah baby|oh yes baby|yeah baby|yes baby|yes we did it|yes i did it|we did it|we did it boys|we did it chat|we actually did it|we won|we won bro|we won boys
we just won|we got him|we got em|we got them|i did it|i actually did it|i actually won|i won bro|winner winner chicken dinner|chicken dinner|victory royale
victory is ours|its so over|we are so back|were so back|were back baby|ggs|ggwp|gg wp|gg ez|gg go next|ez clap|easy clap|too easy|easy money|easy dub|get rekt
get rekted|get wrecked|get clapped|get destroyed|sit down kid|sit down son|take a seat|woohoo|woo hoo|yippee|hooray|hurray|yahoo|bravo|boom baby|boom headshot
boom shakalaka|kaboom|booyah|booyaka|boo yah|get in there|thank you god|thank god|thank goodness|thank the lord|praise the lord|praise god|hallelujah
we finally did it|i finally did it|finally won|finally got it|were on fire|winning streak|kill streak|killstreak|on a roll|clean sweep|flawless victory|perfect game
perfect round|comeback king|the comeback|biggest comeback|the comeback is real|reverse sweep|history has been made|thats history|making history|world record
new record|new personal best|world first|first time ever|best moment ever|best game ever|best play ever|best clip ever|worst game ever|worst play ever
the craziest thing|and the crowd goes wild|crowd goes wild|what a strike|top bins|nothing but net|buzzer beater|thats checkmate
`);

const ENGLISH_BIG_PLAY = list(`
what a shot|what a play|what a clutch|what a game|what a kill|what a round|what a save|what a moment|what a finish|what a comeback|what a goal|what a hit
what a throw|what a snipe|what a flick|what a move|what a pass|what a run|what a fight|what a win|what a match|what a drive|what a jump|what a landing|what a dodge
what a block|what a steal|what a read|what a beast|what a legend|what a player|what a miss|what a fail|what a choke
that was insane|that was crazy|that was sick|that was nuts|that was wild|that was mental|that was filthy|that was disgusting|that was nasty|that was dirty
that was cold|that was clean|that was unreal|that was ridiculous|that was absurd|that was amazing|that was awesome|that was incredible|that was legendary
that was epic|that was perfect|that was beautiful|that was gorgeous|that was huge|that was massive|that was close|that was so close|that was too close
that was so good|that was so sick|that was so clean|that was so cool|that was so dirty|that was so lucky|that was lucky|that was hilarious|that was terrifying
that was scary|that was brutal|that was savage|that was fire|that was bonkers|that was bananas|that was cracked|that was goated|that was outrageous
thats insane|thats crazy|thats sick|thats nuts|thats wild|thats mental|thats filthy|thats disgusting|thats nasty|thats unreal|thats ridiculous|thats absurd
thats amazing|thats awesome|thats incredible|thats legendary|thats epic|thats huge|thats massive|thats hilarious|thats brutal|thats savage|thats fire|thats bonkers
thats bananas|thats goated|thats outrageous|thats so good|thats so sick|thats so clean|thats so funny|thats so crazy|thats so cool
this is insane|this is crazy|this is nuts|this is wild|this is unreal|this is ridiculous|this is bonkers|this is mental|this is absurd|this is outrageous
this is amazing|this is awesome|this is incredible|this is legendary|this is epic|this is so good|this is so sick|this is fire|this is cinema|this is peak
insane|insane bro|insane dude|insane play|insane kill|insane round|insane game|insane moment|insane shot|insane flick|insane clutch|crazy bro|crazy dude|crazy play
crazy kill|crazy round|crazy game|crazy moment|crazy shot|crazy flick|sick bro|nuts bro|wild bro|unreal|unreal bro|sick shot|sick flick|unbelievable shot
incredible shot|incredible play|absolutely incredible|absolutely insane|absolutely crazy|absolutely nuts|absolutely filthy|absolutely disgusting|absolutely unreal
absolute legend|absolute beast|absolute madman|absolute mad lad|absolute monster|absolute banger|absolute cinema|absolute insanity|absolute carnage|absolute scenes
absolute unit|absolute chad|what scenes|unbelievable scenes|mad lad|you madman|you absolute madman|you beauty|you legend|you beast|you animal|you monster|you genius
you are insane|youre insane|you are crazy|youre crazy|you are cracked|youre cracked|you are the goat|youre the goat|you cant do that
hes cracked|hes insane|hes goated|hes nuts|hes cooking|hes him|hes locked in|hes built different|hes on fire|hes a beast|hes a god|hes a menace|hes a monster
hes a demon|hes an animal|hes unreal|hes crazy|hes different|shes cracked|shes insane|shes goated|shes cooking|shes her|shes locked in|shes built different|shes on fire
shes a beast|bro is cracked|bro is him|bro is cooked|bro is cooking|look at him go|look at her go|look at that shot|look at that kill|look at this guy
`);

const ENGLISH_FEELINGS = list(`
im dead|im crying|im screaming|im shaking|im shook|im so done|im finished|im losing it|im losing my mind|im going crazy|im going insane|im cooked|im cracked|im him
im goated|im built different|im locked in|im speechless|im in shock|im actually shaking|im actually crying|im actually dead|im tweaking|im on fire|im unstoppable
im the goat|im so good|im so bad|im so lucky|im tilted|im so tilted|im malding|im fuming|im raging|im gonna cry|im gonna throw up|im gonna lose it|im gonna scream
im about to cry|i cant breathe|i cant even|i cant stop laughing|i cant do this|i cant take it|i cant take this|i just died|i almost died|i nearly died|i got scared
i got jumped|i am dead|i am crying|i am shaking|i am speechless|i am shook|i have no words|no words|speechless|lost for words|i was so scared|that scared me
that scared the shit out of me|you scared me|scared the crap out of me|jump scare|jumpscare|i almost had a heart attack|heart attack|my heart is racing
my heart is pounding|my hands are shaking|my hands are sweaty|sweating bullets|i got chills|i got goosebumps|goosebumps|im dying|im dying bro|dying of laughter
im wheezing|wheezing|that killed me|that took me out|that sent me|that is hilarious|so funny|too funny|that was so funny|funniest thing|funniest thing ive ever seen
stop stop stop|stop it stop it|stop im dying|hahaha|hahahaha|ahahaha|ha ha ha|lmao|lmfao|rofl|chat is this real|chat are you seeing this|chat are we serious
chat what do i do|yo chat|chat look at this
`);

const ENGLISH_GAMING = list(`
clutch|clutched|clutch up|clutch or kick|huge clutch|absolute clutch|clutch god|clutch king|nice clutch|big clutch|clutched it|clutched up|he clutched|i clutched|1v1|1v2|1v3
1v4|1v5|one v one|one v two|one v three|one v four|one v five|one versus five|one versus four|thats an ace|he got an ace|i got an ace|ace bro|got the ace|team ace|clean ace
double kill|triple kill|quadra kill|quad kill|penta kill|pentakill|mega kill|ultra kill|monster kill|killing spree|rampage|godlike|wicked sick|first blood|headshot|headshots
head shot|one tap|one tapped|one tap bro|one shot|one shotted|one shot him|one shot kill|insta kill|instakill|no scope|noscope|quick scope|quickscope|trick shot|trickshot
nice shot|good shot|great shot|lucky shot|clean shot|perfect shot|sniped|nice snipe|he sniped me|got sniped|wallbang|wall bang|through the wall|through the smoke|through smoke
flick shot|nice one|nice try|nice kill|nice play|nice hit|well played|good game|good games|great game|good fight|good round|great round|great play|big play|huge play
game winning|game winner|game winning goal|match point|last man standing|last one alive|last alive|last circle|final circle|final zone|last zone|one more kill|last kill
last bullet|last second|last shot|at the last second|with one hp|one hp|1 hp|one health|no health|no hp|out of ammo|no bullets|enemy behind you|behind you|hes behind you
on your left|on your right|watch out|look out|heads up|theyre here|theyre coming|they are coming|hes coming|hes right there|right there right there|i see him|i see them
got one|got two|knocked one|knocked him|knocked two|i knocked|i downed|one down|two down|three down|all down|all dead|team wiped|team wipe|squad wipe|squad wiped|wiped them
wiped the squad|full squad|whole squad|entire squad|whole team|entire team|killed them all|killed everyone|kill him|kill them|finish him|finish him off|finish it
push push push|push him|push them|go go go|run run run|run bro|somebody help me|help me bro|help me please|please help me|help help|save me|revive me|res me|rez me|pick me up
heal me|im down|im knocked|im dead bro|im low|im one shot|hes one shot|hes one|hes low|hes dead|hes down|hes knocked|they got me|he got me|i got shot|mission failed|mission passed
respect plus|police are coming|cops are coming|five stars|five star wanted|wanted level|he stole my car|stole my car|it blew up|he blew up|i blew up|i exploded|it exploded
ran me over|he ran me over|i got run over|hit by a car|i fell off|fell off the map|off the cliff|its glitched|game crashed|the game crashed|it crashed|crashed bro
`);

const ENGLISH_FRUSTRATION = list(`
are you joking|you must be joking|this is a joke|what a joke|you gotta be joking|this game is broken|this game is rigged|this game hates me|this is rigged|rigged bro|thats rigged
so rigged|hacker|hackers|thats a hacker|hes hacking|aimbot|hes aimbotting|hes cheating|cheater|stream sniper|stream sniped|hes stream sniping|fuck this game|fuck this|fuck that
fuck me|fuck off|fuck you|screw this|screw this game|damn it|dammit|god damn|goddamn|god damn it|goddammit|i hate this game|i hate this|i quit|im quitting|im uninstalling
uninstall the game|delete the game|delete this game|rage quit|ragequit|i missed everything|i choked|he choked|choked it|thats a choke|we threw|i threw the game|he threw|thats a throw
he sold|i sold|we sold|you sold|we lost it|we lost bro|its over for us|its joever|it is joever|skill issue|massive skill issue|thats a skill issue
`);

const ENGLISH_INTERNET = list(`
poggers|pogchamp|pog pog|pogu|huge pog|kekw|omegalul|copium|hopium|massive w|huge w|big w|thats a w|take the w|giant w|w streamer|w rizz|w chat|w clip|massive l|huge l|big l
thats an l|take the l|giant l|l bozo|let him cook|let him cook bro|let her cook|let me cook|he cooked|she cooked|he is cooking|we are cooked|were cooked|we cooked|you are cooked
youre cooked|he is cooked|hes cooked|cooked bro|absolutely cooked|he locked in|built different|different breed|plus aura|minus aura|aura farming|infinite aura|negative aura
thousand aura|aura points|no cap|on god|on god bro|deadass|fr fr|for real for real|clip that|clip it|clip this|clip that chat|clip that shit|somebody clip that|someone clip that
clip that please|chat clip that|please clip that|thats a clip|thats clip worthy|thats going in the highlights|highlight reel|put that in the highlights|thats content|content bro
this is content|thats going on youtube|thats going viral|thats a montage|montage clip|full send|peak cinema|thats peak|this is peak|peak gaming|the goat|goated|goated with the sauce
the goat is back|actual goat|ate that|ate and left no crumbs|understood the assignment|caught in 4k|hes shook|big brain|big brain play|galaxy brain|giga chad|gigachad|sigma move|chad move
`);

const HINGLISH_EXCLAMATIONS = list(`
are baap re|baap re|baap re baap|arre yaar|arre bhai|arre waah|arre nahi|arre nahi yaar|arre nahi bhai|arre re re|arre re|arre kya|arre kya kar raha hai|arre kya hua|arre ye kya
arre ye kya hua|arre ye kya ho gaya|arre mar gaya|arre bhag|arre maar|arre maar na|arre maar usko|arre dekh|arre dekho|arre ruk|arre ruko|arre bas|arre kaise|hai ram|hey ram|he ram
hai bhagwan|hey bhagwan|he bhagwan|oh bhagwan|ae bhagwan|ya allah|ya khuda|ya rab|hai allah|mere bhagwan|mere maalik|mere rab|oh teri|o teri|oh teri ki|o teri ki|teri ki|oh tere ki
teri maa ki aankh|teri ki taisi|teri aisi ki taisi|aisi ki taisi|oh bhai|o bhai|oh bhai sahab|bhai sahab|o bhai sahab|oye hoye|oye teri|oye bhai|oye kya|oye maar|oye balle|balle balle
chak de|chak de phatte|chak de india|shabash|shabash beta|shabash bhai|wah wah|wah kya|wah bhai|wah bhai wah|wah yaar|wah wah wah|wah kya baat hai|wah kya shot|wah kya game
wah kya khela|wah mere sher|wah beta|wah ustad|wah taj|wah maza aa gaya|wah re|wah re wah|kya baat hai|kya baat kar raha hai|kya baat kar rahe ho|kya baat hai bhai|kya baat hai yaar
kya baat hai boss|kya scene hai|kya scene hai yaar|scene kya hai|ye kya tha|ye kya hua|ye kya ho gaya|ye kya ho raha hai|ye kya kar diya|ye kya kiya|ye kya kar raha hai
ye kya bakwas hai|ye kya chal raha hai|ye kya dekh liya|ye kya maar diya|ye kya tha bhai|ye kya tha yaar|ye kya hua bhai|ye kaise|ye kaise hua|ye kaise ho gaya|ye kaise hua bhai
ye kaise kiya|ye kaise mara|ye kaise bach gaya|ayo|aiyo|aiyo rama|ayyo rama|maiya re|oh maiya|ai maiya|oh maa|o maa|hai maa|ae maa|oh meri maa|maa kasam|maa ki kasam|mummy ki kasam
mummy bachao|papa bachao|mashallah|subhanallah|jai ho|jai shree ram|jai mata di|har har mahadev|bajrang bali ki jai|ganpati bappa morya|sat sri akal|jo bole so nihal
`);

const HINGLISH_BHAI = list(`
bhai kya|bhai kya tha|bhai kya hua|bhai kya kar diya|bhai kya kar raha hai|bhai kya khela|bhai kya khel gaya|bhai kya shot|bhai kya shot mara|bhai kya game|bhai kya mara|bhai kya clutch
bhai kya clutch mara|bhai kya player hai|bhai kya bol raha hai|bhai kya dekh liya|bhai kya ho gaya|bhai kya ho raha hai|bhai kya chal raha hai|bhai kya bawal hai|bhai kya bawal tha
bhai kya bawal kar diya|bhai kya banda hai|bhai kya aadmi hai|bhai kya insaan hai|bhai kya scene hai|bhai kya hai ye|bhai ye kya|bhai ye kya tha|bhai ye kya hua|bhai ye kya ho gaya
bhai ye kya kar diya|bhai ye kaise|bhai ye kaise hua|bhai ye kaise ho gaya|bhai ye banda|bhai ye banda pagal hai|bhai ye hacker hai|bhai ye pro hai|bhai ye op hai|bhai mar gaya|bhai mar gaye
bhai mar gayi|bhai mar gaye hum|bhai maar diya|bhai mara|bhai maar|bhai maar na|bhai maar usko|bhai bhag|bhai bhago|bhai bach|bhai bacha|bhai bacha le|bhai bachao|bhai bach gaya|bhai bach gaye
bhai gaya|bhai gaya main|bhai chala gaya|bhai nikal|bhai nikal ja|bhai nikal gaya|bhai ruk|bhai ruko|bhai ruk ja|bhai dekh|bhai dekh kya|bhai dekho|bhai sach mein|bhai sach me|bhai sachi
bhai sahi hai|bhai sahi mein|bhai sahi tha|bhai sahi khela|bhai sahi mara|bhai mast|bhai mast tha|bhai mast khela|bhai mast shot|bhai maza aa gaya|bhai op|bhai op hai|bhai op khela|bhai op bolte
bhai pagal|bhai pagal hai|bhai pagal hai kya|bhai pagal ho gaya|bhai pagal kar diya|bhai dimag kharab|bhai dimag kharab ho gaya|bhai hacker|bhai hacker hai|bhai hack|bhai hack hai|bhai nahi
bhai nahi yaar|bhai nahi nahi|bhai nahi hoga|bhai nahi ho raha|bhai nahi mara|bhai please|bhai please nahi|bhai bas|bhai bas kar|bhai bas karo|bhai chhod|bhai chhod de|bhai kasam se|bhai meri kasam
bhai tu to|bhai tu pagal hai|bhai tu kya hai|bhai tu bhagwan hai|bhai tu god hai|bhai tu legend hai|bhai tu op hai|bhai aag|bhai aag laga di|bhai aag hai|bhai fire|bhai insane|bhai crazy
bhai kamaal|bhai kamaal kar diya|bhai kamaal ho gaya|bhai gazab|bhai gazab kar diya|bhai gazab ho gaya|bhai zabardast|bhai khatarnak|bhai khatarnak tha|bhai khatarnak khela|bhai lag gayi
bhai lag gaye|bhai lag gayi wat|bhai phat gayi|bhai gg|bhai gg hai|bhai jeet gaye|bhai jeet gaya|bhai jeet liya|bhai haar gaye|bhai haar gaya|bhai hum jeet gaye|bhai clutch|bhai clutch kar diya
bhai clip|bhai clip kar|bhai clip karo|bhai clip kar lo|bhai ka level|bhai ka swag|bhai ki entry|bhai level hai|bhai log dekho|bhai log ye kya|bhai hai ya|bhai mere|bhai mere bhai|mere bhai
mere bhai kya|mere bhai ye kya|mere sher|mera bhai op|mera bhai legend
`);

const HINGLISH_YAAR_ABE = list(`
yaar kya|yaar kya tha|yaar ye kya|yaar ye kya hua|yaar ye kya ho gaya|yaar kya kar diya|yaar kya khela|yaar nahi|yaar bas|yaar mar gaya|yaar maza aa gaya|yaar please|yaar sach mein|yaar pagal
yaar kamaal|yaar mast|yaar kya baat hai|yaar kaise|yaar kaise hua|yaar kaise ho gaya|yaar hadd hai|yaar had ho gayi|yaar bahut hua|yaar bakwas|yaar chhod|yaar chhod de|yaar haar gaye|yaar jeet gaye
kya yaar|kya yaar bhai|kya yaar tu|kya yaar ye|abe yaar|abe kya|abe kya kar raha hai|abe kya hua|abe ye kya|abe ye kya hua|abe mar|abe maar|abe maar na|abe bhag|abe bhag bhag|abe ruk|abe dekh
abe oye|abe saale|abe pagal|abe pagal hai kya|abe nahi|abe chal|abe hat|abe chhod|abe ja|abe ja na|abe bc|abe mc|abe chutiye|abe gadhe|abe ullu|abe dekh na|abe o bhai|abe saale kya|abe yaar kya
abe tu kya|abe kaise|abe kaise mara
`);

const HINGLISH_ACTION = list(`
mar gaya|mar gayi|mar gaye|mar gaye hum|mar gaya bhai|mar gaya yaar|mar gaya main|mar gayi main|main mar gaya|mai mar gaya|hum mar gaye|maar diya|maar dala|maar liya|maar lo bhai|maar usko
usko maar|use maar|isko maar|maro maro|maar maar|maar maar maar|maar saale ko|mara mara|mara usko|mara maine|maine mara|maine maar diya|maine maar liya|ek mara|ek gaya|ek gira|ek down|do gaye
do mare|do maar diye|teen gaye|teen mare|teen maar diye|chaar gaye|charo gaye|charon ko maar diya|sabko maar diya|sab mar gaye|sab gaye|sab khatam|sab khatam ho gaya|sab khatam hai|khatam tata
khatam tata bye bye|khatam bye bye|game khatam|game over bhai|khel khatam|khel khatam paisa hajam|khatam ho gaya|khatam kar diya|khatam karo|khatam karo isko|khatam kar isko|khatam kar de
saaf kar diya|saaf kar de|saaf ho gaya|puri team saaf|pura squad saaf|pura squad uda diya|squad wipe kar diya|squad wipe ho gaya|squad khatam|team khatam|uda diya|uda de|uda do|uda diya bhai
utha diya|pel diya|pel do|pel de|pel diya bhai|thok diya|thok de|thok do|thok dala|tapka diya|tapka de|tapa tap|tapa tap headshot|patt se headshot|khopdi tod|khopdi tod saale ka|ghusa de|ghusa do
ghus ja|ghus jao|ghuso ghuso|daal daal|daal daal pura daal|pura daal|boom baam|dhamaka|dhamaka ho gaya|dhamaka kar diya|dhamaal|dhamaal machi|dhamaal macha diya|dhuan nikal diya|dhuan uda diya
dhuandhar|dho diya|dho dala|dho dala bhai|dho de|dho do|dhulai kar di|dhulai ho gayi|kut diya|kut gaya|kutai ho gayi|kutai kar di|pitai ho gayi|pit gaya|pit gaye|peet diya|rula diya|rula de
rula do|ro raha hu|ro raha hoon|ro dunga|rona aa gaya|rona aa raha hai|bhago|bhag bhag|bhago bhago|bhag ja|bhag jao|bhag yaha se|bhago bhai|bhag bsdk|nikal lo|nikal yaha se|nikal pehli fursat mein
nikal gaya bhai|bach gaya|bach gaye|bach gayi|bach gaya bhai|bal bal bach gaya|bal bal bache|bacha le|bacha lo|bachao|bachao bachao|bachao mujhe|mujhe bachao|jeet gaye|jeet gaya|jeet gayi
jeet gaye bhai|jeet gaye yaar|hum jeet gaye|ham jeet gaye|main jeet gaya|jeet liya|jeet liya bhai|match jeet liya|game jeet liya|jeet gaye hum|haar gaye|haar gaya|haar gayi|haar gaye bhai
haar gaye yaar|hum haar gaye|main haar gaya|match haar gaye|chicken mil gaya|chicken dinner mil gaya|chicken kha liya|chicken aa gaya|chicken le liya|chicken le lo|chicken pakka|chicken dinner bhai
booyah mil gaya|booyah kar diya|booyah bhai|booyah ho gaya|booyah le liya|clutch kar diya|clutch maar diya|clutch mara|clutch maar liya|clutch ho gaya|clutch kar liya|one v four kar diya
1v4 kar diya|1v4 mara|1v4 maar diya|1v3 kar diya|1v3 mara|1v3 maar diya|ace kar diya|ace mara|ace maar diya|headshot mara|headshot maar diya|headshot de diya|headshot lag gaya|headshot laga
sidha headshot|ek headshot|ek goli|ek goli mein|ek goli me|ek hi goli|ek shot mein|ek shot me|ek hi shot|ek hi shot mein|one tap kar diya|one tap mara|one shot kar diya|one shot hai|one shot hai bhai
one shot bhai|wo one shot hai|sniper se mara|sniper mara|awm se mara|awm lag gaya|awm mara|grenade mara|nade mara|nade daal|nade daal do|nade aayi|nade aa gayi|grenade aa gaya|grenade aa gayi
grenade daal|grenade daal de|revive kar|revive kar de|revive kar bhai|revive karo|mujhe utha|mujhe utha le|bhai utha|bhai uthao|peeche hai bhai|peeche dekh|peeche dekho|peeche se aaya|peeche se maar diya
wo raha bhai|wo aa rahe hai|dushman aa gaya|dushman aa gaye|enemy aa gaya|enemy aa gaye|enemy aaya|enemy peeche|enemy upar|enemy niche|camp kar raha hai|camper hai|saala camper|saala hacker|hacker hai
hacker hai bhai|hacker hai ye|ye hacker hai|ye banda hacker hai|hacker nikla|hacker aa gaya|hack hai|hack kar raha hai|hack use kar raha hai|hacker mil gaya|report maro|report mar do|aimbot hai
aimbot laga rakha hai|wallhack hai|wallhack laga rakha hai|cheater hai|cheating hai|cheating kar raha hai|lag maar gaya|lag aa gaya|net chala gaya|game crash ho gaya|phone hang ho gaya
chalo chalo|chal chal|chalo jeet te hai|jaldi jaldi|jaldi jaldi jaldi|ruk ruk|ruk ruk ruk|ruko ruko|ruko ruko ruko|ruk ja bhai
dekha bhai|dekha chat|dekho dekho|dekho dekho dekho|dekh dekh|dekh dekh dekh|dekh bhai dekh|dekh kya kiya|dekh kya mara|dekho kya hua|dekho kya kiya|dekho kya mara|aap logo ne dekha|tum logo ne dekha
chat dekho|chat ye dekho|chat kya hua|chat kya tha|chat ye kya|clip kar|clip kar lo|clip kar le|clip karo|clip karo bhai|clip bana|clip bana lo|clip banao|clip ban gaya|clip nikal|clip nikalo|ye clip karo
ye clip kar lo|ye clip hona chahiye|short banega|short bana lo|short bana do|highlight banega|ye highlight hai|viral hoga|ye viral hoga|viral ho jayega|ye viral ho jayega
`);

const HINGLISH_PRAISE = list(`
mast hai|mast tha|mast khela|mast shot|mast game|mast kill|ekdum mast|mast mast|bahut mast|kya mast|kya mast tha|zabardast|zabardast hai|zabardast tha|zabardast shot|zabardast khela|kya zabardast
ekdum zabardast|bahut zabardast|gazab|gazab hai|gazab tha|gazab ho gaya|gazab kar diya|gazab khela|gazab ka shot|gazab bhai|kamaal hai|kamaal tha|kamaal ho gaya|kamaal kar diya|kamaal khela
kamaal ka shot|kamaal ka khel|kamaal ka banda|kamaal kar di|khatarnak|khatarnak hai|khatarnak tha|khatarnak shot|khatarnak khela|khatarnak banda|ekdum khatarnak|bahut khatarnak|kya khatarnak
jhakaas|ekdum jhakaas|kya jhakaas|bole to jhakaas|bawaal|bawaal hai|bawaal tha|bawaal kar diya|bawaal ho gaya|bawaal macha diya|bawaal machi|bawaal mach gaya|bawaal mach gayi|kya bawaal|solid hai
solid tha|solid bhai|ek number|ek number yaar|ek number bhai|ek number hai|ek number tha|ek number shot|ekdum ek number|op bolte|op bolte public|op bhai|op hai|op hai bhai|op tha|op khela|op shot
op player|op banda|bahut op|kya op|full op|ekdum op|lit hai|lit tha|fire hai|fire tha|aag hai|aag laga di|aag laga diya|aag lagi|aag lag gayi|aag laga de|aag macha di|aag kar di|tabahi|tabahi hai
tabahi macha di|tabahi kar di|tabahi mach gayi|kya tabahi|kayamat|kayamat hai|kayamat aa gayi|kayamat kar di|danger hai|danger khela|kadak|kadak hai|kadak tha|kya kadak|ekdum kadak|kadak shot
bhayankar|bhayankar hai|bhayankar tha|bhayankar shot|bhayankar khela|kya bhayankar|bhari padega|bhari pad gaya|bahut bhari|sahi hai bhai|sahi hai boss|sahi khela|sahi mara|sahi pakde hai|bahut sahi
sahi khel gaya|bahut badiya|ekdum badiya|badiya khela|badiya shot|kya badiya|maza aa gaya|maza aa raha hai|maza aa gaya bhai|maza aa gaya yaar|kya maza aa gaya|bahut maza aa gaya|maze aa gaye
paisa vasool|pura paisa vasool|mauj kar di|mauj ho gayi|mauja hi mauja|thala for a reason|vadiya ji|bahut vadiya|sher hai|sher hai tu|sher aaya|sher bhai|babbar sher|babbar sher hai|bhagwan hai
bhagwan hai tu|tu bhagwan hai|bhagwan hai ye banda|banda bhagwan hai|god hai|god hai tu|god level|god level hai|god level shot|next level hai|next level tha|alag level|alag level hai|alag hi level
alag hi level hai|alag hi banda hai|legend hai|legend hai tu|legend hai bhai|legend tha|banda legend hai|king hai|king hai tu|baap hai|baap hai tu|baap hai sabka|sabka baap|sabka baap hai|baap aa gaya
baap ko mat sikha|baap se panga|baap baap hota hai|tera baap aaya|tera bhai op|tera bhai aa gaya|tera bhai legend|ustad hai|ustad ji|guru ji|guru hai|maan gaye|maan gaye bhai|maan gaye ustad|maan gaye guru
maan gaye boss|maan gaye yaar|maan gaya bhai|full respect|respect bhai|izzat badh gayi|izzat gayi|izzat chali gayi|izzat ki dhajjiyan|beizzati ho gayi|beizzati kar di|gazab beizzati|gazab beizzati hai yaar
besti ho gayi|besti kar di|bhai ki besti|insult ho gayi|roast ho gaya|roast kar diya|kya khela|kya khela bhai|kya khela yaar|kya khel gaya|kya khel gaya bhai|kya shot|kya shot mara|kya shot tha
kya shot hai|kya shot hai bhai|kya headshot|kya headshot mara|kya clutch|kya clutch mara|kya clutch hai|kya clutch tha|kya game tha|kya match tha|kya match hai|kya round tha|kya kill|kya kill tha
kya kill mara|kya mara|kya mara hai|kya player|kya player hai|kya player hai yaar|kya banda hai|kya aadmi hai|kya insaan hai|kya cheez hai|kya cheez hai yaar|kya cheez tha|kya cheez thi
sixer maar diya|chakka mara|chakka maar diya|chauka mara|clean bold|googly daal di|game palat gaya|game palat diya|game hi palat gaya|game badal gaya|game ulta ho gaya|ulta pad gaya|ultra pro max
ultra legend|pro max hai|jalwa hai|jalwa hai bhai|swag se swagat|tashan hai|bhaukaal|bhaukaal hai|bhaukaal machi hai|gadar|gadar macha diya|gadar kar diya|gadar machi hai|gadar hai|gadar bhai
kya gadar|hungama ho gaya|hungama macha diya|macha diya|macha diya bhai|tod diya|tod de|tod do|tod dala|tod ke rakh diya|fod diya|fod de|fod do|faad diya|faad de|faad do|faad ke rakh diya|cheer diya
cheer ke rakh diya|maar ke rakh diya|hila ke rakh diya|hila diya|hila daala|jala diya|jala de|dhaage khol diye|dhaage khol diya|kaim hai|kaint hai|att hai|att kar ti|siraa hai|ghaint hai
`);

const HINGLISH_SHOCK = list(`
kya hua bhai|kya hua yaar|kya ho gaya|kya ho gaya bhai|kya ho gaya yaar|kya ho raha hai bhai|kya ho raha hai ye|kya kar diya|kya kar diya bhai|kya kar diya yaar|kya kar raha hai tu
kya kar raha hai bhai|kya kar rahe ho bhai|kya karu ab|kya karu yaar|ab kya karu|kya tha ye|kya tha bhai|kya tha yaar|kya tha wo|kya dekh liya|kya bakwas hai|kya chal raha hai bhai|kya re bhai
kya re baba|kya be bhai|kya be saale|kya bc|kya mc|kya bakchodi hai|kya chutiyapa hai|kaise kiya|kaise hua|kaise ho gaya|kaise mara|kaise bach gaya|kaise mar gaya|kaise mar gaya main|kaise mara usne
kaise lag gaya|kaise lag gayi|kaise kar diya|kaise kar liya|kaise dekh liya|ye banda kaise|ye kaise possible hai|kaise possible hai|possible nahi hai|ho hi nahi sakta|ye ho hi nahi sakta
aisa ho hi nahi sakta|nahi ho sakta|ho nahi sakta|ye nahi ho sakta|ye possible nahi hai|aisa kaise|aisa kaise ho gaya|aisa kaise ho sakta hai|aisa kaun karta hai|aisa kabhi nahi dekha
kabhi nahi dekha|maine kabhi nahi dekha|aaj tak nahi dekha|aaj tak aisa nahi dekha|aisa pehli baar dekha|pehli baar dekha|yakeen nahi ho raha|yakeen nahi hota|vishwas nahi ho raha
believe nahi ho raha|believe nahi hota|mujhe yakeen nahi ho raha|mujhe believe nahi ho raha|sach mein bhai|sach mein yaar|kya sach mein|kasam se bhai|kasam se yaar|meri kasam|bhagwan kasam
bhagwan ki kasam|god promise bhai|khuda kasam|allah kasam|teri kasam|nahi nahi|nahi nahi nahi|nahi bhai|nahi yaar|nahi nahi bhai|nahi re|nahi nahi yaar|mujhse nahi hoga|mujhse nahi ho raha
nahi ho raha yaar|nahi ho pa raha|hadd hai|had hai yaar|had ho gayi|hadd kar di|hadd kar di aapne|had kar diya|bas kar bhai|bas kar pagle|bas kar yaar|bas karo yaar|bas karo bhai
bas kar pagle rulayega kya|rulayega kya|bas bas bas|chhod yaar|chhod bhai|pagal hai kya|pagal ho gaya|pagal ho gaya hai|pagal ho gaya kya|pagal ho kya|pagal ho gaye|pagal kar diya|pagal kar dega
tu pagal hai|tu pagal hai kya|ye pagal hai|banda pagal hai|ye banda pagal hai|pagla gaya|pagal ho jaunga|dimag kharab|dimag kharab hai|dimag kharab hai kya|dimag kharab ho gaya|dimag kharab mat kar
dimag ka dahi|dimag ka dahi kar diya|dimag ka dahi ho gaya|dimag hil gaya|dimag hila diya|dimag ghum gaya|dimag phat gaya|dimag ki batti jal gayi|sir ghum gaya|sar ghum gaya|sar phat gaya
lag gayi|lag gaye|lag gayi bhai|lag gaye bhai|lag gayi wat|wat lag gayi|wat lag gaya|wat laga di|wat laga diya|lag gayi lanka|lanka lag gayi|lanka laga di|lanka lag gaya|lanka laga diya|band baj gayi
band baj gaya|band baja diya|band baja di|baja diya|baja di|game baj gaya|hil gaya|hil gaye|hil gayi|dara diya|dar gaya|dar gayi|dar gaya bhai|dar gaye|dar lag raha hai|phat gayi|fat gayi|phat gayi bhai
meri phat gayi|meri fat gayi|gaand phat gayi|gaand fat gayi|gaand lag gayi|sat gayi|sat gaye|sat gaya|barbaad ho gaya|barbaad ho gaye|barbaad kar diya|barbaad ho gaya bhai|tabah ho gaya|tabah kar diya
tabah ho gaye|khatam ho gaye|lut gaya|lut gaye|lut gaye bhai|loot liya|loot le gaya|thag liya|chuna laga diya|chuna lag gaya|gaya kaam se|gaya kaam se bhai|gaye kaam se|kaam tamam|kaam lag gaya
kaam lag gaya bhai|jaan bachi|jaan bach gayi|jaan bachi lakho paaye|jaan nikal gayi|jaan hi nikal gayi|jaan chali gayi|saans ruk gayi|saans atak gayi|dil ruk gaya|dil baith gaya|dil toot gaya
dil garden garden ho gaya|dil garden|dil khush ho gaya|dil khush kar diya|dil jeet liya|dil jeet liya bhai|dil se respect|dil hil gaya|dhadkan badh gayi|haath kaap rahe hai|haath kaanp rahe hai
rongte khade ho gaye|rongte khade|goosebumps aa gaye|chills aa gaye|lafda ho gaya|locha ho gaya|locha hai|locha lapsi|raada ho gaya|panga ho gaya|panga le liya|panga mat le|panga liya|jugaad lag gaya
jugaad ho gaya|kaand ho gaya|kaand kar diya|kaand ho gaya bhai|kalesh ho gaya|kalesh ho raha hai|kalesh mach gaya|kya kalesh hai|bhasad ho gayi|bhasad mach gayi|bhasad machi hai|has has ke mar gaya
haste haste mar gaya|pet dard ho gaya|pet dukh gaya|has ke lot pot|lot pot ho gaya|hasi nahi ruk rahi|hasi ruk nahi rahi|kya comedy hai|comedy ho gayi|comedy kar diya|kya comedy|bhai comedy
circus chal raha hai|tamasha ho gaya|kya tamasha hai|maiyya re
`);

const HINGLISH_MEMES = list(`
ye dukh kahe khatam nahi hota|ye dukh kahe khatam nahi hota be|jor jor se bolke sabko scheme bata de|utha le re baba|utha le re deva|utha le re baba mereko nahi|rukawat ke liye khed hai
paisa hi paisa hoga|25 din mein paisa double|ye baburao ka style hai|haan babu bhaiya|mogambo khush hua|kitne aadmi the|picture abhi baaki hai|abhi picture baaki hai
rishte mein to hum tumhare baap lagte hain|don ko pakadna mushkil hi nahi namumkin hai|ek baar jo maine commitment kar di|mere paas maa hai|tareekh pe tareekh|ja simran ja
ja simran ja jee le apni zindagi|thappad se darr nahi lagta|how is the josh|how is the josh high sir|high sir|mere karan arjun aayenge|pushpa jhukega nahi|jhukega nahi|main jhukega nahi
flower nahi fire hai|ye bik gayi hai gormint|bik gayi hai gormint|aunty police bulayegi|pawri ho rahi hai|bhai ne bola karne ka to karne ka|bhai kya kar raha hai tu|ab maza aayega na bhidu
ab aayega maza|ab maza aayega|ab aayega na maza|baccha hai tu mera|ye le bhai|ye le beta|le beta le|lele bhai|beta tumse na ho payega|beta tumse nahi ho payega|tumse na ho payega
tumse nahi ho payega|tujhse na ho payega|maharaj ki jai ho|kya bolti public|bolti public|kya re bhidu|sat gayi meri|nikal pehli fursat me
`);

const HINGLISH_SWEARS = list(`
bc kya|bc yaar|arre bc|bc ye kya|bc maar|bc bhag|bc mar gaya|bc kaise|bc nahi|mc bc|bc mc|bkl|bsdk|bhosdike|bhenchod|madarchod|chutiya|chutiye|chutiyapa|chutiyapa hai|gandu hai|lawde
laude lag gaye|lawde lag gaye|lode lag gaya|bakchodi mat kar|teri maa ki|jhantu|harami saala|kutte kamine|saale kutte|ullu ke patthe|ullu ka pattha|bada noob|kitna noob hai|noob hai ye|bot hai ye
bakwas game|bakwas khela|bekar khela|bekar game|faltu game|ghatiya game|kachra game|kachra khela
`);

const HINDI_SCRIPT = list(`
अरे बाप रे|बाप रे|बाप रे बाप|अरे यार|अरे भाई|अरे वाह|अरे नहीं|अरे नहीं यार|अरे रे|अरे रे रे|अरे ये क्या|अरे ये क्या हुआ|अरे ये क्या हो गया|अरे मर गया|हे राम|हाय राम|हे भगवान|ओह भगवान|या अल्लाह
हाय अल्लाह|मेरे भगवान|ओ तेरी|ओ तेरी की|ओह तेरी|ओए होए|बल्ले बल्ले|चक दे|शाबाश|शाबाश बेटा|वाह वाह|वाह भाई|वाह यार|वाह क्या बात है|वाह क्या शॉट|वाह क्या गेम|वाह मज़ा आ गया|वाह रे वाह
क्या बात है|क्या बात है भाई|क्या बात है यार|ये क्या था|ये क्या हुआ|ये क्या हो गया|ये क्या हो रहा है|ये क्या कर दिया|ये क्या किया|ये कैसे|ये कैसे हुआ|ये कैसे हो गया|ये कैसे किया|ये कैसे बच गया
भाई क्या था|भाई क्या हुआ|भाई ये क्या|भाई ये क्या था|भाई ये क्या हुआ|भाई ये क्या हो गया|भाई ये कैसे|भाई ये कैसे हुआ|भाई क्या कर दिया|भाई क्या खेला|भाई क्या खेल गया|भाई क्या शॉट|भाई क्या शॉट मारा
भाई क्या मारा|भाई क्या क्लच|भाई मर गया|भाई मर गए|भाई मार दिया|भाई मार|भाई मार ना|भाई भाग|भाई भागो|भाई बच गया|भाई बचा|भाई बचा ले|भाई बचाओ|भाई सही है|भाई मस्त|भाई मज़ा आ गया|भाई पागल है
भाई पागल है क्या|भाई नहीं|भाई नहीं यार|भाई प्लीज|भाई बस|भाई बस कर|भाई कसम से|भाई हैकर है|भाई जीत गए|भाई हार गए|भाई गया|भाई गेम ओवर|भाई ओपी|भाई ओपी है|भाई क्लिप कर|भाई क्लिप करो|भाई साहब
ओ भाई|ओ भाई साहब|यार क्या|यार ये क्या|यार ये क्या हुआ|यार नहीं|यार मर गया|यार मज़ा आ गया|क्या यार|अबे यार|अबे क्या|अबे क्या कर रहा है|अबे ये क्या|अबे मार|अबे मार ना|अबे भाग|अबे रुक|अबे देख
अबे साले|अबे ओए|मर गया|मर गई|मर गए|मर गया भाई|मर गया यार|मैं मर गया|हम मर गए|मार दिया|मार डाला|मार दिया भाई|मार लिया|मार उसको|उसको मार|मारो मारो|मार मार|भागो|भागो भागो|भाग भाग|भाग जा
भाग भाई|बच गया|बच गए|बच गई|बाल बाल बच गया|बचाओ|बचाओ बचाओ|बचा ले|बचा लो|मम्मी बचाओ|हाय मां|ओ मां|नहीं नहीं|नहीं नहीं नहीं|नहीं भाई|नहीं यार|नहीं हो सकता|हो ही नहीं सकता|ये नहीं हो सकता
ऐसा कैसे|ऐसा कैसे हो गया|ऐसा कभी नहीं देखा|कभी नहीं देखा|यकीन नहीं हो रहा|विश्वास नहीं हो रहा|बिलीव नहीं हो रहा|कैसे हुआ|कैसे हो गया|कैसे किया|कैसे मारा|कैसे बच गया|कैसे मर गया|क्या हो गया
क्या हो रहा है भाई|क्या कर दिया|क्या कर रहा है भाई|क्या खेला|क्या खेल गया|क्या शॉट|क्या शॉट मारा|क्या शॉट है|क्या क्लच|क्या क्लच मारा|क्या गेम था|क्या मैच था|क्या मारा|क्या मारा है|क्या प्लेयर है
क्या बंदा है|क्या चीज़ है|क्या था ये|क्या था भाई|मज़ा आ गया|मज़ा आ गया भाई|मज़े आ गए|बहुत मज़ा आ गया|ज़बरदस्त|ज़बरदस्त है|ज़बरदस्त था|क्या ज़बरदस्त|गज़ब|गज़ब है|गज़ब हो गया|गज़ब कर दिया|कमाल है
कमाल हो गया|कमाल कर दिया|कमाल का शॉट|खतरनाक|खतरनाक है|खतरनाक था|झकास|बवाल|बवाल है|बवाल कर दिया|धमाल|धमाका|तबाही|तबाही है|तबाही मचा दी|आग लगा दी|आग है|भयंकर|भयंकर है|कड़क|कड़क है|बहुत सही
एक नंबर|एक नंबर भाई|ओपी है|ओपी बोलते|पागल है क्या|पागल हो गया|पागल कर दिया|दिमाग खराब|दिमाग खराब है|दिमाग खराब हो गया|लग गई|लग गए|वाट लग गई|लंका लग गई|लंका लगा दी|बैंड बज गई|बैंड बजा दिया
फट गई|मेरी फट गई|डर गया|डर गए|हिल गया|बर्बाद हो गया|तबाह हो गया|खत्म हो गया|खेल खत्म|गेम खत्म|सब खत्म|पूरी टीम साफ|पूरा स्क्वाड साफ|उड़ा दिया|उड़ा दो|पेल दिया|ठोक दिया|ठोक दो|धो दिया|धो डाला
तोड़ दिया|फोड़ दिया|फाड़ दिया|रुला दिया|जीत गए|जीत गया|हम जीत गए|जीत लिया|हार गए|हार गया|हम हार गए|चिकन मिल गया|चिकन डिनर|विनर विनर चिकन डिनर|बूयाह|हेडशॉट|हेड शॉट|हेडशॉट मारा|हेडशॉट मार दिया
पट से हेडशॉट|क्लच|क्लच कर दिया|क्लच मारा|वन शॉट|वन शॉट है|वन टैप|एक गोली|एक गोली में|हैकर है|ये हैकर है|चीटर है|क्लिप कर|क्लिप कर लो|क्लिप करो|क्लिप इट|क्लिप दैट|ये क्लिप करो|बस कर|बस करो|बस कर भाई
बस कर पगले|हद है|हद हो गई|हद कर दी|चलो चलो|रुक रुक|रुको रुको|रुक जा|देख देख|देखो देखो|जल्दी जल्दी|ओ माय गॉड|ओह माय गॉड|ओएमजी|नो वे|नो नो नो|व्हाट द हेल|व्हाट द फक|होली शिट|लेट्स गो|गेम ओवर|गुड गेम
जीजी भाई|वेल प्लेड|इनसेन|दैट वाज़ इनसेन|सो क्रेज़ी|अनबिलीवेबल|बाप है|बाप है तू|सबका बाप|शेर है|शेर है तू|भगवान है|तू भगवान है|लीजेंड है|मान गए|मान गए भाई|मान गए उस्ताद|पैसा वसूल|जय हो|जय श्री राम
हर हर महादेव|जय माता दी|भेनचोद|बहनचोद|मादरचोद|चूतिया|चूतिये|भोसड़ी के
`);

export const HYPE_PHRASES = [
  ...ENGLISH_DISBELIEF,
  ...ENGLISH_EXCLAMATIONS,
  ...ENGLISH_HYPE,
  ...ENGLISH_BIG_PLAY,
  ...ENGLISH_FEELINGS,
  ...ENGLISH_GAMING,
  ...ENGLISH_FRUSTRATION,
  ...ENGLISH_INTERNET,
  ...HINGLISH_EXCLAMATIONS,
  ...HINGLISH_BHAI,
  ...HINGLISH_YAAR_ABE,
  ...HINGLISH_ACTION,
  ...HINGLISH_PRAISE,
  ...HINGLISH_SHOCK,
  ...HINGLISH_MEMES,
  ...HINGLISH_SWEARS,
  ...HINDI_SCRIPT,
];

/** Spellings of one word that people use interchangeably. Keys and values have doubled letters already removed. */
export const SAME_WORD: Record<string, string> = {
  kia: "kya",
  nahin: "nahi", nhi: "nahi", nai: "nahi", nhin: "nahi",
  h: "hai", hy: "hai", hain: "hai", hein: "hai",
  gya: "gaya", gia: "gaya", gyi: "gayi", gai: "gayi", gye: "gaye",
  rha: "raha", rhi: "rahi", rhe: "rahe",
  kr: "kar", kro: "karo", krna: "karna", karun: "karu",
  dia: "diya", lia: "liya",
  krdia: "kar diya", krdiya: "kar diya", kardia: "kar diya", kardiya: "kar diya",
  hogya: "ho gaya", hogaya: "ho gaya", hogyi: "ho gayi", hogayi: "ho gayi", hogye: "ho gaye", hogaye: "ho gaye",
  hoa: "hua", hva: "hua", huya: "hua", huyi: "hui",
  bhot: "bahut", bohot: "bahut", bht: "bahut", boht: "bahut", bohut: "bahut", bhut: "bahut",
  vah: "wah",
  arey: "are", aray: "are",
  abey: "abe", aby: "abe",
  oy: "oye", oe: "oye",
  yr: "yar",
  yeh: "ye",
  woh: "wo", vo: "wo",
  jabardast: "zabardast", zbrdst: "zabardast", jbrdst: "zabardast", zabrdast: "zabardast", jabrdast: "zabardast",
  gajab: "gazab", ghazab: "gazab", ghajab: "gazab",
  khatrnak: "khatarnak",
  baval: "bawal", bwal: "bawal",
  badhiya: "badiya", badia: "badiya", bdiya: "badiya", bdia: "badiya", badhia: "badiya",
  shi: "sahi", sai: "sahi",
  kese: "kaise", kaisey: "kaise", kesa: "kaisa", esa: "aisa", ese: "aise", aisey: "aise",
  kyun: "kyu", kyon: "kyu",
  kuchh: "kuch",
  bhgwan: "bhagwan", bagwan: "bhagwan",
  pagl: "pagal",
  maja: "maza", mja: "maza", mza: "maza", maje: "maze",
  behenchod: "bhenchod", benchod: "bhenchod", bhencho: "bhenchod",
  maderchod: "madarchod",
  chutia: "chutiya", chotiya: "chutiya",
  bhosadike: "bhosdike", bhosdk: "bhosdike",
  lavde: "lawde", lode: "lawde", laude: "lawde",
  eknumber: "ek number",
  ohmygod: "oh my god", letsgo: "lets go", lesgo: "lets go", lezgo: "lets go", noway: "no way",
  ghadar: "gadar", bezati: "beizati", qayamat: "kayamat",
  plz: "please", pls: "please", plis: "please",
  // Hindi script, after the matcher drops the nasal and dot marks.
  यह: "ये", गयी: "गई", गये: "गए",
};
