import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface StoryPart {
  title: string;
  content: string[];
  audioUrl?: string;
}

interface StoryItem {
  id: string;
  title: string;
  subtitle: string;
  author?: string;
  tag: string;
  parts: StoryPart[];
}

@Component({
  selector: 'app-truyen-ma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './truyen-ma.component.html',
  styleUrl: './truyen-ma.component.scss'
})
export class TruyenMaComponent implements OnInit, OnDestroy {
  constructor(private readonly sanitizer: DomSanitizer) { }

  readonly desktopBackgroundCssUrl = this.buildBackgroundCssUrl('assets/images/ngu-hanh-desktop.png');
  readonly mobileBackgroundCssUrl = this.buildBackgroundCssUrl('assets/images/ngu-hanh-mobile.png');

  readonly stories: StoryItem[] = [
    {
      id: 'giai-nghiep',
      title: 'GIẢI NGHIỆP',
      subtitle: 'Ngoại truyện: Thầy Tàu ly kỳ truyện',
      author: 'LongPV',
      tag: 'Tâm linh - Trinh thám - Nhân văn',
      parts: [
        {
          title: 'Tiếng ru',
          audioUrl: 'https://drive.google.com/file/d/1zgAWcvUBYWVD40sH2H2ViA_sMQuooQvE/view?usp=sharing',
          content: [
            'Năm 2005, làng Thiết Trụ vẫn còn nguyên cái vẻ cũ kỹ, chậm rãi của một vùng quê ven sông Bắc Bộ.',
            'Con đường làng chạy ngoằn ngoèo giữa những bức tường gạch cũ loang rêu, chỗ thì lát gạch nghiêng ngả, chỗ thì trơ đất nện, cứ mưa xuống là lầy, nắng lên là bụi. Buổi sáng, người ta nghe tiếng quang gánh kẽo kẹt của mấy bà đi chợ sớm, tiếng vịt kêu ngoài mương, tiếng máy tuốt lúa từ cánh đồng vọng về từng chập. Đến trưa, cả làng lịm đi trong cái nắng trắng chang chang, chỉ còn tiếng ve dội từ những tán nhãn, tán gạo, với tiếng loa xã rè rè phát mấy bản tin cũ. Chiều xuống, gió từ ngoài đê sông thổi vào mang theo mùi rơm rạ, mùi bùn non, mùi khói đốt đồng ngai ngái len qua từng ngõ nhỏ, quấn vào mái tóc, nếp áo của người đi đường.',
            'Nhà nào khá giả hơn thì có cái tivi hộp đặt giữa gian ngoài, tối tối cả nhà quây lại xem thời sự hay cải lương. Nhà ít điều kiện thì vẫn ngồi quạt nan ngoài hiên, vừa bắt muỗi vừa nghe đài cassette cũ. Trẻ con trong làng quen chân đất chạy rong từ trưa tới xế, lúc thì chơi bi ngoài đầu ngõ, lúc thì bẻ trộm ổi nhà hàng xóm, tối đến bị gọi về tắm nước giếng, ăn cơm với cà muối. Mọi thứ đều bình thường, bình thường đến mức người ta tưởng cái làng này cứ thế mà yên ổn mãi.',
            'Cho đến khoảng hơn nửa tháng nay.',
            'Không ai nhớ rõ chuyện bắt đầu từ đêm nào. Chỉ biết từ một đêm nào đó, cứ quá nửa đêm là từ bãi nhãn sau đình lại vọng về tiếng ru con.',
            'Ban đầu chỉ là vài tiếng ầu ơ rất nhỏ, lẫn trong tiếng dế kêu, tiếng lá nhãn xào xạc. Ai nghe thấy cũng tưởng mình nằm mơ, hoặc nghe nhầm tiếng ai ru trẻ ở xóm bên. Nhưng rồi đêm nào nó cũng có. Lúc gần, lúc xa. Có đêm nghe như đứng ngay đầu ngõ. Có đêm lại như từ dưới mặt đất sâu hun hút vọng lên. Giọng đàn bà ấy buồn rười rượi, đều đều, kéo dài từng chữ, nghe đến đâu lạnh sống lưng đến đó.',
            'Có người còn quả quyết rằng ngoài tiếng ru, họ nghe cả tiếng mõ cốc... cốc... cốc... như có ai dùng đầu ngón tay gõ lên nắp áo quan.',
            'Làng Thiết Trụ vốn không phải nơi nhát ma nhát quỷ. Người già trong làng từng trải chiến tranh, từng đi sơ tán, từng ngủ đồng ngủ bãi, chuyện âm phần với họ không lạ. Nhưng chính vì thế, họ càng biết có những thứ không nên gọi tên.',
            'Lúc đầu, người ta còn cười xòa.',
            'Lão Đoài ở xóm Đông bĩu môi: “Chắc lũ ranh con rủ nhau dọa ma.”',
            'Ông Bảy nhà đầu ngõ cũng phẩy tay: “Ma cỏ gì. Toàn người sống dọa nhau.”',
            'Thế rồi con chó mực nhà ông Bảy chết.',
            'Đêm đó oi bức, điện trong làng chập chờn từ đầu tối. Cái bóng đèn dây tóc trong gian nhà chính cứ đỏ lên rồi tối phụt, làm bà Bảy bực mình lấy quạt mo quạt phành phạch. Ông Bảy thì cởi trần nằm trên chiếc chõng tre, bụng phập phồng theo từng nhịp thở nặng nhọc của người đàn ông quen ngủ sớm.',
            'Ngoài sân, con chó mực nằm dưới gốc cau thỉnh thoảng lại ăng ẳng một tiếng, không rõ vì nóng hay vì ngửi thấy gì lạ.',
            'Bà Bảy đang lim dim thì bỗng bật dậy: “Ông nó... ông nó ơi... ngoài sân có người.”',
            'Ông Bảy cau có kéo cái chăn mỏng lên ngực: “Người gì giờ này? Nửa đêm nửa hôm ai sang.”',
            '“Không phải... có tiếng phụ nữ. Hình như đang ru con.”',
            'Ông Bảy chống tay ngồi dậy, lắng tai. Quả nhiên ngoài sân có tiếng ầu ơ rất khẽ. Nó mỏng như tơ, nhưng cứ quẩn quanh trước hiên, lúc ở sát cửa, lúc lại lùi ra tận cổng, nghe chẳng khác nào có người đang đi qua đi lại, vừa đi vừa ru.',
            '“Ầu ơ... gió đưa cây cải về trời...”',
            'Ông Bảy thấy hai cánh tay mình nổi da gà.',
            'Nhưng tính ông vốn ngang. Có vợ ngồi bên cạnh, lại thêm sĩ diện đàn ông, ông không muốn tỏ ra sợ.',
            '“Để tôi ra xem đứa nào dở trò.”',
            'Ông với cái đèn pin con ó đã cũ, nhấn công tắc mấy lần mới sáng. Luồng sáng vàng đục quét qua khoảng sân gạch loang nước, qua chum tương kê sát hiên, qua gốc cau có buộc sợi dây xích con chó mực. Tiếng ru vẫn còn đó, mỏng như khói, lẩn vào trong gió.',
            'Bà Bảy bám chặt sau lưng chồng, giọng run run: “Ông đừng ra xa quá...”',
            'Ông Bảy gắt khẽ: “Bà vào trong đi.”',
            'Nhưng chính tay ông cũng đang run.',
            'Ánh đèn vừa lia tới gốc cau, cả hai cùng chết sững. Con chó mực nằm co giật, bốn chân duỗi cứng. Mép nó sùi bọt trắng, hai mắt trợn ngược như vừa nhìn thấy thứ gì khủng khiếp lắm. Từ ngoài cổng kéo vào là một vệt bùn đen, loãng mà nhớp, in lẫn những dấu chân nhỏ xíu như chân trẻ con.',
            'Bà Bảy rú lên: “Ối giời ơi!”',
            'Cùng lúc đó, ngay sát tai hai vợ chồng, tiếng ru bỗng cất lên rõ mồn một: “Ầu ơ... mẹ bồng con ngủ...”',
            'Ông Bảy quay phắt lại. Sân vẫn trống không.',
            'Chỉ có chiếc võng trong hiên đang đung đưa nhè nhẹ, như vừa có người ngồi xuống.',
            'Chiếc võng vẫn đung đưa. Kẽo… kẹt… kẽo… kẹt… Không có gió.',
            'Ông Bảy đứng chết lặng vài giây rồi vụt tắt đèn pin, kéo bà Bảy lùi vào trong. “Đóng cửa lại!” – ông quát khẽ.',
            'Cửa gỗ vừa khép lại, tiếng ru bỗng sát ngay bên kia vách: “Ầu ơ… ngủ đi con…”',
            'Bà Bảy ôm chặt miệng, nước mắt trào ra: “Ông ơi… nó ở ngoài cửa…”',
            'Ông Bảy không đáp. Tay ông siết chặt cái then gỗ, mắt dán vào khe cửa.',
            'Một cái bóng lướt qua. Không phải đi. Mà như trôi.',
            'Sáng hôm sau, cả làng xôn xao.',
            'Người già trong làng bắt đầu nhớ lại cái chuyện cũ bên bãi nhãn sau đình. Chuyện ấy đã chôn vùi hơn hai mươi năm, chẳng ai muốn nhắc. Vậy mà bây giờ, cứ như có bàn tay nào đó bới lại.',
            'Ba hôm sau, đến lượt nhà ông giáo Hinh gặp nạn.',
            'Con bé Nguyệt, tám tuổi, nửa đêm tự nhiên bật dậy mở cửa đi ra sân. Bà nội nó đang thức dậy đi tiểu tiện, nhìn thấy liền gọi lại: “Nguyệt! Mày đi đâu?”',
            'Con bé đứng sững, quay lưng về phía bà. Giọng nó đáp khàn khàn, không giống giọng trẻ con: “Con ra bãi nhãn. Mẹ gọi.”',
            'Bà cụ lạnh cả gáy. Mẹ con bé ngủ buồng trong chạy ra, ôm chặt lấy nó. Người nó lạnh như ngâm nước giếng từ chiều tới giờ. Sáng hôm sau con bé sốt mê man, miệng cứ lặp đi lặp lại một câu: “Có người bế con ngồi dưới gốc nhãn... bà ấy bảo đào lên... đào lên...”',
            'Ông giáo Hinh sợ quá, đi mời một thầy cúng ở xã bên sang. Thầy cúng bày mâm gạo muối, thắp hương, cầm kiếm gỗ đi quanh sân, miệng đọc lầm rầm. Mới được nửa tuần trà thì bên ngoài cửa bỗng vang lên tiếng đàn bà cười khanh khách.',
            'Thầy cúng dừng phắt. Gió lùa phụt tắt cả hai cây nến. Một bàn tay đen sì in hằn lên cánh cửa gỗ.',
            'Thầy cúng tái mét, ném luôn kiếm đào, ôm túi chạy mất dép.',
            'Từ hôm đó, không ai còn dám bén mảng ra bãi nhãn nữa.',

            'Trời về chiều, con đường đất từ phía Thái Bình sang Hưng Yên phủ một lớp bụi mỏng vàng đục. Nắng đã dịu đi, nhưng hơi nóng vẫn hắt lên từ mặt đường, khiến không khí rung nhẹ như có làn khói mỏng lơ lửng.',
            'Thầy Lương bước đi chậm rãi. Cây gậy trúc trong tay ông chạm xuống đất từng nhịp đều đặn, khô và chắc. Quãng đường từ Thái Bình sang không hề ngắn, vậy mà ông đi như thể đã quen với những chuyến độc hành như vậy từ rất lâu rồi. Áo nâu bạc màu dính đầy bụi, lưng áo thấm mồ hôi, nhưng dáng đi vẫn vững vàng, không hề tỏ ra mệt mỏi.',
            'Khi đặt chân lên con đê đầu làng Thiết Trụ, ông bỗng dừng lại.',
            'Một cơn gió từ bãi sông thổi lên, mang theo mùi phù sa quen thuộc… nhưng ẩn sâu trong đó lại có một thứ gì khác. Một cảm giác lạnh và nặng, giống như mùi đất vừa bị xới tung lên rồi vội vã lấp lại.',

            'Ông khẽ nhíu mày, ánh mắt trầm xuống.',

            '“Đất ở đây đã bị động rồi… không phải chuyện nhỏ,” ông lẩm bẩm, giọng thấp nhưng rõ ràng.',

            'Dưới chân đê, cánh đồng vẫn hiện ra yên bình như mọi ngày. Xa xa, vài người nông dân đang gánh rạ, tiếng nói cười vang lên rồi lại tắt dần theo gió. Thế nhưng, khi ông bước thêm vài bước vào đầu làng, cảm giác bất thường càng lúc càng rõ rệt.',

            'Những con chó nằm im lìm, không sủa lấy một tiếng.',
            'Cây đa đầu ngõ đứng lặng, không có lấy một cánh chim đậu.',
            'Không khí xung quanh dường như đặc quánh lại, nặng nề hơn bình thường, khiến người ta khó thở nếu đứng lâu.',

            'Thầy Lương dừng lại lần nữa. Ông chậm rãi đưa mắt nhìn về phía đình làng, nơi bãi nhãn nằm khuất sau mái ngói cũ kỹ.',

            'Ông hít sâu một hơi.',

            'Mùi âm khí lúc này đã hiện rõ, không còn lẫn lộn.',

            'Bóng người thầy pháp già, cao gầy, kéo dài trên con đường làng phủ bụi. Dáng đi tuy chậm nhưng vững chãi, mỗi bước đều như đã định sẵn.',
            'Ông biết rất rõ, chuyến đi này… mình đã đến đúng nơi cần đến.',

            'Cùng lúc ấy, ở quán nước đầu làng, ông Lễ trưởng thôn, anh Phúc công an viên, lão Đoài, ông Bảy và mấy người đàn ông ngồi chụm đầu bàn chuyện.',
            'Lão Đoài châm điếu thuốc lào, rít một hơi, rồi nói như sợ ai nghe thấy: “Tôi nói thật, mọi chuyện bắt đầu từ hôm thằng Tính đào được cái lu sành.”',
            'Ông Lễ ngẩng lên: “Lu gì?”',
            '“Lu đen. Chôn sát gốc nhãn già sau đình. Nắp dán bùa đỏ. Hôm ấy nó với thằng Cường đào giun, cuốc phải. Nó thấy lạ đem về.”',
            'Anh Phúc đập tay xuống bàn: “Sao giờ ông mới nói?”',
            '“Thì tôi tưởng đồ cổ. Ai ngờ mang họa.”',
            'Ngay lúc ấy, trước quán có một người đàn ông già đi vào.',
            'Ông mặc áo nâu đã bạc màu, cổ áo sờn mép, quần tối màu, chân đi giày vải, đeo một chiếc túi vải chéo vai. Dáng người gầy, lưng hơi còng, tóc điểm bạc gần hết. Trông chẳng khác gì một ông lão nhà quê đi đường xa ghé xin bát nước.',
            'Nhưng khi ông bước vào, mấy câu chuyện trong quán tự nhiên chùng xuống. Không ai bảo ai, nhưng tất cả đều liếc nhìn.',
            'Ông đặt cái túi vải cũ xuống ghế, ngồi chậm rãi như đã quen với việc bị quan sát, rồi lên tiếng: “Bà chủ, cho tôi bát nước chè. Đi từ đầu đê vào đây, nắng gắt quá.”',
            'Giọng ông cụ khàn nhưng rõ, có chút mệt của người đi đường xa.',
            'Bà bán nước rót chè, tò mò hỏi: “Cụ ở đâu sang mà lạ thế?”',
            'Ông cười nhẹ: “Tôi đi nhiều nơi rồi, chỗ nào có việc thì ghé. Làng mình dạo này… không yên.”',
            'Câu nói khiến mấy người trong quán khựng lại.',
            'Ông Lễ nheo mắt: “Cụ nghe ai nói?”',
            'Ông Lương lắc đầu: “Không cần nghe. Đất nói trước rồi.”',
            'Anh Phúc hỏi dồn: “Cụ nói rõ hơn được không?”',
            'Ông nhấp ngụm chè, rồi đặt xuống: “Ở làng này có thứ không nên đào, mà lại đào. Không nên mở, mà lại mở.”',
            'Lão Đoài run tay: “Cụ… nói cái lu à?”',
            'Ông Lương nhìn thẳng: “Đúng.”',
            'Không khí chùng xuống.',
            'Ông Lễ hỏi: “Cụ là ai?”',
            '“Tôi là Lương, một thầy Tàu đi tìm sự sống, không phải cho tôi mà cho những người mà tôi hữu duyên gặp trên con đường tôi đi.”',
            'Không hiểu sao, câu nói rất nhẹ ấy lại làm cả quán thấy không khí nặng hẳn xuống.'
          ]
        },
        {
          title: 'Lập trận Trấn hồn',
          audioUrl: 'https://drive.google.com/file/d/1dBwl8mlqR0U8Pn8PcUO1nqAcqhE20q7B/view?usp=sharing',
          content: [
            'Nhà thằng Tính nằm lẻ loi ở cuối làng, nép mình bên con mương nước đọng đen ngòm, lờ đờ trôi như một dải lụa chết. Hai bên bờ mương, cỏ dại mọc cao quá đầu người, chiều xuống lại bốc lên cái mùi ẩm mục, tanh tao của bùn đất lâu ngày không thấy ánh mặt trời.',
            'Khi ông Lễ dẫn thầy Lương tới nơi, Tính đang ngồi bó gối ngoài hiên. Gương mặt nó xám ngoét, đôi mắt trũng sâu, hốc hác như người đã bị rút cạn sinh khí. Vừa thấy dáng người mặc bộ đồ tào xá sẫm màu, túi vải chéo vai bước vào, nó bất giác nuốt khan, giọng run bắn:',
            '“Cụ… cụ cũng là thầy pháp ạ?”',
            'Thầy Lương không đáp. Bước chân ông khoan thai mà nặng nề, mỗi bước đi như đóng đinh xuống mặt đất sân gạch cũ. Ánh mắt tinh anh của ông lướt qua một lượt rồi dừng khựng lại trước chiếc lu sành đặt dưới góc hiên. Chiếc lu đen sì, bám đầy bùn đất khô khốc, cái nắp gốm bị cạy lệch sang một bên để lộ một khoảng tối thẳm sâu. Trên vành lu, những vết mực tàu của lá bùa trấn yểm xưa kia đã mục nát, mờ căm.',
            'Ông khom người, chòm râu dài khẽ lay động theo nhịp thở nhưng tuyệt đối không để chạm vào vành lu.',
            '“Cái lu này… cậu đã tự tay mở ra?”',
            'Giọng ông trầm đục, uy nghiêm như tiếng vọng từ lòng đất, khiến Tính không dám có nửa lời dối gạt. Nó lí nhí:',
            '“Dạ… con lỡ tay, thưa thầy.”',
            'Thầy Lương đứng thẳng dậy, đôi mắt sâu hoắm nhìn thẳng vào Tính:',
            '“Cậu không phải vô tình đâu. Có thứ đã dẫn cậu đến đó, mượn tay cậu để tự giải thoát cho nó.”',
            'Tính rùng mình, hai hàm răng đánh vào nhau lập cập. Thầy Lương tiếp lời, giọng lạnh lẽo:',
            '“Bên trong có gì, nói rõ cho ta nghe.”',
            '“Thưa thầy… trong đó có một mớ tóc rối, một con dao gỉ… và có mùi tanh rất nặng, giống như mùi xác chết.”',
            'Thầy Lương khẽ gật đầu, ánh mắt sâu lại.',
            '“Tóc để trói hồn, dao để sát khí. Những thứ cậu thấy chỉ là cái vỏ. Quan trọng là thứ bị nhốt bên trong… giờ nó đã thoát ra ngoài”',
            'Mẹ Tính nghe đến đó thì khuỵu xuống khóc nức nở, tiếng khóc nghẹn lại trong cổ họng vì sợ hãi:',
            '“Thầy ơi, cứu con tôi. Từ hôm mang cái lu về, đêm nào nó cũng mê sảng. Có hôm nửa đêm nó tự đi ra giếng, gọi không quay lại…”',
            'Thầy Lương quay sang nhìn Tính, ánh mắt như xuyên thấu:',
            '“Trong mơ, cậu thấy một người đàn bà tóc xõa che kín mặt, ôm cái bọc đen quấn tã, đòi cậu trả con, đúng không?”',
            'Tính lập tức run bắn.',
            '“Thầy… sao thầy biết? Con chưa từng hé răng với ai…”',
            'Thầy Lương đứng thẳng dậy, giọng vẫn đều:',
            '“Không cần cậu nói. Oán khí ở cái lu này đã khai hết rồi.”',
            'Anh Phúc đứng bên cạnh, cổ họng khô khốc:',
            '“Thầy… rốt cuộc thứ trong lu là gì?”',
            'Thầy Lương chắp tay sau lưng, nhìn về phía bãi nhãn xa xa.',
            '“Đây không phải đồ cổ. Đây là vật trấn để xích một oan hồn cực dữ.”',
            'Ông dừng lại một chút rồi nói tiếp:',
            '“ Người chết oan, oán không tan, bị trấn sai cách thì sau trăm năm sẽ hóa thành Quỷ.”',
            'Không ai dám lên tiếng. Không gian rơi vào im lặng đến nghẹt thở.',
            'Ông Lễ hỏi:',
            '“Thầy định xử lý thế nào?”',
            'Thầy Lương đáp, ánh mắt không đổi:',
            '“Đêm nay ta sẽ ở lại. Việc này không giải trong một sớm một chiều.”',
            '“Chúng tôi cần chuẩn bị gì không, thầy cứ nói.”',
            'Ông Lương suy nghĩ một nhịp rồi nói:',
            '“Chuẩn bị cho ta một con gà trống tơ. Bảy cây đinh gỉ, tháo từ nhà cũ. Một bát tro bếp của người góa phụ. Và nhớ cho kỹ…”',
            'Ông nhìn từng người:',
            '“Từ giờ tới sáng mai, sau giờ Tý, không một ai được bước chân ra khỏi nhà. Dù có nghe thấy gì… cũng không được mở cửa.”',
            'Không ai dám hỏi thêm.',
            'Gió từ ngoài mương thổi vào, mang theo cái lạnh ẩm mốc len qua từng kẽ áo.',
            'Chiếc lu sành dưới mái hiên… khẽ phát ra một tiếng “cốc” rất nhỏ.',
            'Trời sập tối rất nhanh. Mới lúc chiều còn le lói chút nắng vương trên mái rạ, vậy mà chỉ một thoáng sau, cả làng đã chìm vào một màu xám đục, nặng nề như có đám mây đen nào đó đè xuống.',
            'Người trong làng lục tục kéo nhau về nhà từ sớm hơn mọi ngày.Không ai bảo ai, nhưng bước chân ai cũng vội, cũng cúi gằm mặt, như sợ phải nhìn thấy thứ gì đó đang rình rập ngoài đường.',

            'Cửa nhà đóng then cài chặt. Ánh đèn dầu leo lét hắt ra qua khe cửa, yếu ớt đến mức chẳng đủ xua đi bóng tối ngoài sân.',

            'Trong từng nếp nhà, tiếng người nói chuyện vẫn có… nhưng nhỏ đến mức chỉ còn là những lời thì thào, đứt quãng.Có nhà còn chẳng dám bật đèn sáng, chỉ ngồi im trong bóng tối, lắng nghe từng tiếng động rất khẽ ngoài ngõ.',

            'Cả làng im ắng một cách kỳ lạ.',

            'Không còn tiếng chó sủa, không tiếng trẻ con khóc, chỉ có gió lùa qua lũy tre, rì rào như ai đó đang nói chuyện ở rất xa… mà lại nghe rõ ngay bên tai.',

            'Ông Lễ đứng chần chừ một lúc, rồi tiến lại gần thầy Lương, giọng hạ thấp:',
            '“Thưa thầy… việc đêm nay xem ra không phải chuyện nhỏ. Nếu thầy cho phép… tôi xin được ở lại đây, có gì còn phụ giúp thầy một tay.”',

            'Anh Phúc đứng bên cạnh cũng gật đầu:',
            '“Vâng, tôi cũng xin ở lại. Dù gì tôi cũng là công an trong làng, để thầy một mình… chúng tôi không yên tâm.”',

            'Thầy Lương liếc nhìn hai người, ánh mắt sâu mà trầm. Ông im lặng một lúc lâu, như đang cân nhắc.',
            'Thầy Lương nhìn họ thêm một lúc, rồi khẽ gật đầu:',
            '“Được. Hai người ở lại. Nhưng phải nhớ lời ta dặn.”',

            'Ông đưa tay chỉ ra ngoài sân:',
            '“Khi ta làm việc… Dù 2 người có thấy gì… cũng không được tự ý ra tay.”',

            'Cả hai người cùng đáp:',
            '“Vâng, chúng tôi nhớ rồi.”',

            'Màn đêm buông xuống',
            'Gian giữa nhà Tính chỉ thắp một ngọn đèn dầu, ánh sáng phập phùng, lấp ló qua những khe cửa. Trước sân nhà, Thầy Lương ngồi xuống chiếc ghế thấp, đặt nghiên mực trước mặt, Bên cạnh là một con dao mỏng. Ông nhắm mắt lại, hai tay đặt lên đầu gối, hơi thở chậm dần. Miệng ông lẩm nhẩm những câu chú nhỏ và trầm, nghe như tiếng gió lẫn trong tiếng đất.',
            'Một lúc sau, ông mở mắt. Ánh nhìn sáng quắc, khác hẳn vẻ mệt mỏi ban ngày. Ông lấy chu sa, dùng mũi dao rạch nhẹ đầu ngón tay trái, nhỏ thêm vài giọt máu từ đầu ngón tay vào nghiên. Mực đỏ sẫm lại, đặc quánh.',
            'Tờ giấy vàng được trải ra. Bút lông chạm xuống giấy, thầy Lương bắt đầu vẽ.',
            'Nét đầu tiên kéo dài, liền mạch. Rồi nét thứ hai, thứ ba… uốn lượn như rồng bay. Không hề ngập ngừng. Tính đứng nhìn mà thấy sống lưng lạnh toát.',
            'Vẽ xong, thầy kẹp lá bùa giữa hai ngón tay, đưa lên ngang mặt, thổi mạnh một hơi:',
            '“Cẩn!”',
            'Ngọn nến bên cạnh rung bần bật.',
            'Thầy Lương đứng dậy, bảo Tính mang bát tro bếp và con gà trống ra. Dùng dao cắt nhanh vào cổ gà, hứng lấy vài giọt máu còn nóng vào bát sứ. Máu đỏ sẫm, bốc hơi nhẹ trong khí lạnh.',
            'Ông trộn máu gà vào tro bếp, dùng tay bóp nhẹ cho hòa đều, rồi rải hỗn hợp đó thành một vòng tròn kín quanh cái lu. Mỗi nắm tro rải xuống, ông đều lẩm nhẩm đọc chú. Sau đó thầy rắc tiếp gạo nếp, muối và cắm tám cọc gỗ theo tám hướng tương ứng với 8 quẻ: Càn, Khảm, Cấn, Chấn, Tốn, Ly, Khôn, Đoài. Những sợi chỉ ngũ sắc được đan vào nhau và được nối từ chiếc lu ở tâm trận ra 8 hướng, tạo thành 1 mạng nhện khổng lồ, xung quanh treo thêm vài lá bùa và chuông nhỏ.',
            'Mỗi bước ông đi không thẳng mà theo hình vòng, lúc tiến lúc lùi, như đang vẽ thêm một vòng vô hình dưới chân.',
            'Tiếng chú ông đọc lúc này trầm và nặng, khiến không khí như đặc lại.',
            'Tính khẽ hỏi:',
            '“Thưa thầy… trận pháp này tên là gì và thế này đã giữ được nó chưa ?”',
            'Thầy Lương không quay lại:',
            '"Bát Quái Phục Ma... trận đã lập, nhưng lòng người có tĩnh thì trận mới bền. Đêm nay, sống hay chết là ở ý trời."',
            'Ông dừng lại, chống tay lên đầu gối. Trán đã lấm tấm mồ hôi.',


            'Canh hai vừa điểm, chó cả làng đồng loạt tru.',
            'Rồi tiếng ru nổi lên.',
            '“Ầu ơ... ví dầu cầu ván đóng đinh...”',
            'Giọng đàn bà văng vẳng ngoài cổng, não nề đến sởn gai ốc.',
            'Mẹ Tính bụm miệng khóc: “Thầy ơi, nó tới rồi.”',
            'Ông Lương không quay đầu lại: “Mọi người tắt bớt đèn.”',
            'Ngọn đèn dầu được vặn nhỏ xuống. Sân nhà tối mờ.',
            'Từ ngoài cổng, một bóng trắng lướt vào. Không phải đi, mà như trôi trên mặt đất. Đầu tóc dài xõa kín mặt, hai tay ôm một cái bọc đen như đứa trẻ quấn tã.',
            'Tính rú lên: “Chính nó! Chính nó!”',
            'Ông Lương cầm chuỗi tiền đồng, đứng dậy. Cái bóng trắng dừng lại ở mép vòng tro, ngẩng đầu. Dưới mớ tóc ướt là khuôn mặt một người đàn bà đã rữa nát, một bên mắt hõm sâu, bên còn lại đỏ quạch như than hồng.',
            'Nó cất giọng rít: “Hãy đền mạng cho mẹ con ta...”',
            'Một nhịp sau, tiếng rít chuyển thành tiếng tru dài: “Hãy đền mạng cho mẹ con ta...”',
            'Ông Lương nhìn thẳng vào nó, giọng vẫn trầm thấp: “Ngươi vốn bị trấn dưới đất. Sao còn quẩn quanh hại người?”',
            'Con quỷ cười the thé: “Người làng này giết ta. Chôn ta cùng con ta. Sao ta có thể tha cho bọn chúng?”',

            'Dứt lời, con quỷ vung tay. Một luồng âm phong đen kịch tạt mạnh vào sân, khiến dãy đèn cầy quanh trận đồ chao đảo, chỉ còn những đốm lửa xanh lét bé xíu. Tính và mẹ gục xuống, hơi lạnh buốt thấu xương khiến họ không thể thở nổi.',
            'Nhưng ngay khi luồng hắc khí chạm vào vòng tro bếp, trận đồ bỗng rực sáng.',
            'Tám cọc gỗ đào rung lên bần bật như có hàng chục bàn tay vô hình đang lay giật. Những sợi chỉ ngũ sắc căng ra, phát ra tiếng ong ong chói tai như tiếng đàn đứt dây. Những chiếc chuông đồng nhỏ bỗng gầm lên, tiếng kêu không còn là “keng keng” mà là những tiếng vang trầm hùng, đập thẳng vào linh hồn con quỷ.',
            'Con quỷ rít lên, nó lao thẳng vào, đôi tay đầy móng vuốt đen ngòm định xé toạc mạng lưới chỉ đỏ. Nhưng vừa chạm vào, một tia chớp vàng loé lên từ lá bùa treo trên chỉ, hất văng nó ra ngoài. Thầy Lương lúc này hai chân bám chặt xuống đất theo thế Tấn, tay trái cầm chuỗi tiền đồng ép chặt vào ngực để giữ tâm cốt, tay phải bắt ấn nhắm thẳng về phía cái lu ở tâm trận.',
            'Ông quát lớn, tiếng vang như sấm dội: “Càn Khôn định vị, bát quái phục ma. Trấn!”',
            'Một luồng áp lực khổng lồ từ tám hướng ép lại, khiến bóng trắng của con quỷ méo mó, co rúm. Những sợi chỉ ngũ sắc bắt đầu rỉ ra một chất lỏng màu vàng như ánh kim, vây chặt lấy nó. Con quỷ vùng vẫy điên cuồng, miệng sùi ra những bọt đen hôi thối, oán khí tỏa ra nồng nặc đến mức lá cây nhãn trong sân rụng rào rào như tẩm thuốc độc.',
            'Mồ hôi trên trán thầy Lương chảy xuống mắt cay xè, nhưng ông không dám chớp. Chỉ cần ông xao nhãng một giây để con quỷ làm đứt sợi chỉ ở hướng Cấn, toàn bộ người trong sân sẽ mất mạng ngay lập tức.',
            'Dưới áp lực của trận đồ, luồng hắc khí quanh con quỷ dần tan bớt, để lộ thân hình tiều tụy đang run rẩy vì bị pháp lực áp chế. Thấy nó đã bị cầm chân, thầy Lương lúc này mới hơi nới lỏng ấn chú, liếc nhanh về phía Tính: “Ngồi im. Đừng nhìn vào mắt nó.”',
            'Rồi ông giơ một lá bùa khác lên, phất rất nhẹ để giải bớt sát khí của trận pháp, đủ để nó có thể thốt ra lời: “Lui!”',
            'Chỉ một chữ, sức mạnh từ lá phù hất ngược con quỷ về phía mép cổng, nhưng lần này nó không còn lao lên nữa mà đứng sững lại, gầm ghè trong cổ họng. Tiếng rít chói lên như kim loại cào vào tai.',
            'Anh Phúc đứng ngoài cửa, mặt tái mét: “Thầy... sao thầy không đánh tan xác nó luôn?”',
            'Ông Lương không quay lại, mắt vẫn dán chặt vào đôi mắt đỏ quạch của ma nữ:',
            '“Thứ này không đánh bằng sức. Đánh bằng nợ.”',
            'Con quỷ ôm cái bọc đen, vừa khóc vừa cười: “Ta muốn lấy mạng! Ta muốn cả làng này chôn cùng ta!”',
            'Ông Lương chậm rãi bước thêm một bước: “Nếu ta cho ngươi cơ hội được kêu oan, ngươi có dám chỉ tên kẻ đã hại mình không?”',
            'Con quỷ bỗng khựng lại. Tiếng rít gào tan đi, thay vào đó là một sự im lặng đến đáng sợ. Lần đầu tiên kể từ khi xuất hiện, nó bắt đầu lùi bước, đôi mắt đỏ quạch như dịu đi trong cơn đau đớn tột cùng.',
            'Ông Lương hạ giọng, thanh âm không còn gắt gao mà trở nên trầm buồn, thấu hiểu: “Ngươi nhuốm máu đôi tay, giết lũ trẻ, sát hại sinh linh... làm tất cả những chuyện đại ác đó cũng chẳng thể khiến đứa con trong tay ngươi ấm lại được đâu. Muốn đòi nợ cho ra nợ, oán cho ra oán, thì phải đào đúng mồ, gọi đúng tên kẻ thủ ác. Đừng để nỗi hận làm mù quáng chân linh thêm nữa.”',
            'Không gian như đông cứng lại. Con quỷ run lên bần bật, chiếc bọc đen trên tay nó khẽ động đậy. Từ sau mái tóc rối bời, một tiếng nấc nghẹn ngào vang lên, không phải tiếng rít của quỷ dữ mà là tiếng khóc xé lòng của một người đàn bà mất con: “Dưới... gốc nhãn... cứu mẹ con ta...”',
            'Vừa dứt lời, bóng trắng tan biến thành một làn khói đen kịt, lướt nhanh rồi chui tọt vào trong lu sành. Ngọn đèn dầu trên bàn phụt tắt, cả sân nhà Tính chìm trong bóng tối đặc quánh và mùi tử khí thoang thoảng.',
            'Mãi một lúc sau, tiếng lạch cạch của chiếc ghế gỗ mới vang lên. Thầy Lương ngồi sụp xuống, lồng ngực phập phồng, hơi thở nặng nhọc. Trong bóng tối, người ta chỉ thấy đôi mắt ông mệt mỏi nhưng đầy trăn trở. Trán ông sũng mồ hôi, thấm đẫm cả vạt áo đen.',
            'Ông Lễ run rẩy, lắp bắp hỏi: “Thầy... thế là... xong rồi hả thầy?”',
            'Thầy Lương nhìn đăm đăm vào cái lu sành lạnh lẽo, giọng ông khàn đi: “Chưa xong đâu. Những gì chúng ta vừa thấy... mới chỉ là phần oan hồn uất nghẹn của nó thôi.”',
            'Anh Phúc lau mồ hôi trên trán, giọng vẫn chưa hết bàng hoàng: “Vậy còn cái xác... nó đang ở đâu hả thầy?”',
            'Ông Lương im lặng một hồi lâu, hướng ánh mắt về phía bóng tối mịt mù sau đình làng, nơi có cây nhãn già cô độc đang đứng sừng sững: “Dưới cây nhãn già sau đình. Ở đó có nỗi oan khuất bị vùi lấp.”',
            'Ông nhìn mọi người, ánh mắt nghiêm nghị đến lạnh người: “Sáng mai, khi mặt trời lên, chúng ta sẽ đào nó lên. Sự thật phải được đưa ra ánh sáng thôi.”'
          ]
        },
        {
          title: 'Quan tài bảy đinh',
          audioUrl: 'https://drive.google.com/file/d/1LHb-OXpaAcwCMnGwiSMnwJNlcfcrK28t/view?usp=sharing',
          content: ['Sáng hôm sau, thầy Lương cùng gia đình anh Tính và dân làng ra bãi nhãn, sương muối phủ trắng xóa, cái lạnh không phải từ gió trời mà như từ dưới lòng đất bốc lên, luồn lách qua từng kẽ tóc.',
            'Cây nhãn già sừng sững giữa bãi, thân to hai người ôm không xuể, lớp vỏ xù xì rạn nứt. Những chiếc rễ lớn nổi cuồn cuộn trên mặt đất, ngoằn ngoèo như đàn trăn đang canh giữ giấc ngủ ngàn năm. Thầy Lương đứng lặng trước gốc cây, tay bấm quyết, mắt lim dim. Ông rút ba nén hương, quẹt một mồi lửa, khấn vái thầm thì rồi cắm xuống đất. Lạ thay, khói hương không bay tản mác theo gió mà cứ lờ đờ, tụ lại thành một dải mỏng, xoáy nhẹ rồi chìm dần xuống ngay sát một rễ nhãn lớn',
            'Thấy mọi người xầm xì lạ lẫm, thầy Lương ôn tồn giải thích:',
            '"Hương vốn là cầu nối âm dương. Ở nơi có oan khí bị vùi lấp quá sâu, âm khí của đất sẽ níu khói hương lại không cho bay lên. Khói tụ ở đâu, tâm điểm của nỗi oan nằm ở đó."',
            'Thầy nói tiếp, chỉ khẽ vào vị trí khói lặn:',
            '"Đào ở đây. Nhẹ tay, đừng để cuốc phạm vào phần cốt."',
            'Mấy thanh niên trai tráng mình đầy mồ hôi dù trời xe lạnh buổi sáng sớm, thay nhau quật đất. Đào xuống chừng hơn một thước, một tiếng "cộc" khô khốc vang lên. Lớp đất đen ẩm ướt được gạt sang bên, để lộ một tấm ván gỗ đen sì, mủn ra vì nước đọng.',
            'Giữa tấm ván, bảy cây đinh mười phân gỉ sét đóng thành hình chữ "Sát". Một góc ván vẫn còn dính mẩu bùa đỏ thẫm đã mục nát, trông như vết máu khô. Mẹ Tính nhìn thấy thì khuỵu xuống, miệng lẩm bẩm: "Trời cao có mắt... thật sự có mộ"',
            'Thầy Lương bước lại gần, khẽ thở dài, đôi lông mày ông nhíu lại đầy trăn trở. Ông cúi đầu nhìn thật kỹ nhưng ánh mắt không hề có vẻ ghê sợ, mà chỉ tràn đầy sự thương cảm, khẽ gạt lớp bùn trên mặt ván gỗ',
            'Đây không phải mộ, đây là Địa Ngục thu nhỏ. Một cái quan tài được trấn bằng Thất Đinh Yểm Hồn. Họ dùng đinh gỉ để găm chặt linh hồn vào xác, dùng bùa chú để cắt đứt đường luân hồi. Kẻ ác muốn người mẹ này đời đời kiếp kiếp không thể đầu thai, phải chịu cảnh lạnh lẽo, u uất ngay trong lòng đất mẹ. Đau đớn thay, đến đứa trẻ vô tội cũng bị liên lụy... thật là quá nhẫn tâm.',
            'Giữa lúc đám đông đang xầm xì sợ hãi, một tiếng ho khan từ phía sau vang lên. Cụ Mão — người già nhất cái làng này — chống gậy run rẩy tiến tới. Đôi mắt đục mờ của cụ nhìn trân trân vào bảy cây đinh gỉ, gương mặt cắt không còn giọt máu.',
            '"Đúng nó rồi... oan nghiệt quá!" — Cụ Mão ngồi bệt xuống cỏ, nước mắt chảy dài qua những nếp nhăn sâu hoắm như rãnh đất.',
            'Thầy Lương quay sang nhìn cụ Mão và bà con lối xóm, giọng ông trầm xuống, mang theo một nỗi xót xa khôn tả:',
            '"Cụ biết chuyện này, vậy xin cụ hãy kể lại cho tôi và bà con được rõ"',
            'Cụ Mão run giọng kể về năm bảy lăm đói khát. Cô Hồng góa chồng, một mình nuôi con nhỏ giữa cơn loạn lạc. Có dạo trẻ con trong làng ốm liên miên, người ta đồn cô luyện tà thuật trù ẻo lũ trẻ để hút linh khí cho con mình. Đỉnh điểm là khi đứa con ông đồ tể Chấn chết yểu, dân làng điên cuồng kéo tới...',
            'Cụ dừng lại, nước mắt chảy ra theo những nếp nhăn sâu hoắm.',
            '“Người ta trói nó ra bãi nhãn. Nó ôm con, quỳ lạy kêu oan đến khản đặc cả tiếng, nhưng không ai nghe. Chính tay ông Chấn cầm búa đóng đinh, vừa đóng vừa chửi rủa thậm tệ. Tôi... tôi cũng đứng đó nhìn mà không dám can.”',
            'Cả bãi nhãn im bặt, chỉ còn tiếng gió rít qua kẽ lá nghe như tiếng khóc thầm. Thầy Lương nhìn cụ Mão một lúc lâu rồi hỏi:',
            '"Ông Chấn giờ thế nào?"',
            '"Nằm liệt giường mấy tháng nay, người lở loét như bị quỷ rỉa." — Cụ Mão trả lời',
            'Nghe cụ Mão kể về nỗi oan năm xưa, thầy Lương không hề tỏ ra giận dữ với cụ. Ông tiến lại gần, đặt bàn tay gầy guộc nhưng ấm áp lên vai cụ già đang run rẩy, khẽ khàng an ủi:',
            '"Cụ đừng quá dằn vặt. Lúc ấy thế sự loạn lạc, lòng người hoang mang nên mới lầm đường lạc lối. Nay tôi đến đây cũng là để giúp cụ và bà con hóa giải cái nghiệp chướng này."',
            'Anh Phúc nhìn cái quan tài, mồ hôi hột chảy dài:',
            '"Thầy... giờ tính sao với cái này?"',
            'Thầy Lương nhìn đăm đăm vào tấm ván quan tài mục nát, đôi mắt ông trĩu nặng một nỗi xót thương. Ông quay sang, khẽ gật đầu với mấy anh thanh niên rồi ôn tồn nói:',
            '"Các anh giúp tôi, hãy mở nắp quan tài này ra. Cẩn thận một chút, kẻo làm động đến cốt. Phải tháo bỏ những cái đinh này, linh hồn họ mới mong thoát khỏi xiềng xích bấy lâu."',
            'Lúc nắp quan tài mở ra, một mùi tanh tưởi nồng nặc bốc ra khiến đám đông kinh hãi lùi lại, thầy Lương vẫn đứng yên đó, mắt ông nhắm lại, miệng lâm râm đọc bài chú vãng sanh cho hai linh hồn tội nghiệp. Khi nhìn thấy bộ cốt người mẹ ôm chặt lấy con, lòng thầy quặn thắt, đôi lông mày khẽ nhíu lại.',
            'Ông nhìn mọi người, giọng nói lúc này vừa uy nghiêm vừa đầy sự bao dung:',
            '"Oan có đầu, nợ có chủ. Đêm nay chúng ta sẽ mở đàn ở Đình Làng. Tôi muốn mời tất cả bà con trong làng tới dự. Không phải để chúng ta luận tội ai, mà để linh hồn cô Hồng có cơ hội trút bỏ hận thù, để người chết được cất tiếng nói kêu oan, và để người sống chúng ta có dịp cúi đầu, nói với họ một lời xin lỗi chân thành."',
          ]
        },
        {
          title: '',
          content: ['Thầy Lương đói quá, xin các đồng đạo giúp đỡ cho thầy bữa cơm...']
        },
        {
          title: '',
          content: ['Thầy Lương đói quá, xin các đồng đạo giúp đỡ cho thầy bữa cơm...']
        },
        {
          title: '',
          content: ['Thầy Lương đói quá, xin các đồng đạo giúp đỡ cho thầy bữa cơm...']
        },
        {
          title: '',
          content: ['Thầy Lương đói quá, xin các đồng đạo giúp đỡ cho thầy bữa cơm...']
        },
        {
          title: '',
          content: ['Thầy Lương đói quá, xin các đồng đạo giúp đỡ cho thầy bữa cơm...']
        },
        {
          title: '',
          content: ['Thầy Lương đói quá, xin các đồng đạo giúp đỡ cho thầy bữa cơm...']
        },
        {
          title: '',
          content: ['Thầy Lương đói quá, xin các đồng đạo giúp đỡ cho thầy bữa cơm...']
        }
      ]
    }
  ];

  selectedStoryId = this.stories[0].id;
  isStoryListOpen = true;
  expandedPartIndexes = new Set<number>([0]);
  currentAudioPartIndex: number | null = null;
  isAudioPlaying = false;
  isAudioLoading = false;
  audioErrorMessage = '';
  private readonly partAudioCache = new WeakMap<StoryPart, { audioUrl: string | null; previewUrl: SafeResourceUrl | null }>();

  private readonly audioPlayer: HTMLAudioElement | null =
    typeof Audio !== 'undefined' ? new Audio() : null;

  private readonly handleAudioEnded = (): void => {
    this.isAudioPlaying = false;
    this.isAudioLoading = false;
    this.currentAudioPartIndex = null;
  };

  private readonly handleAudioPause = (): void => {
    this.isAudioPlaying = false;
    this.isAudioLoading = false;
  };

  private readonly handleAudioPlay = (): void => {
    this.isAudioPlaying = true;
    this.isAudioLoading = false;
    this.audioErrorMessage = '';
  };

  private readonly handleAudioError = (): void => {
    this.isAudioPlaying = false;
    this.isAudioLoading = false;
  };

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.isStoryListOpen = false;
    }

    if (this.audioPlayer) {
      this.audioPlayer.preload = 'metadata';
      this.audioPlayer.addEventListener('ended', this.handleAudioEnded);
      this.audioPlayer.addEventListener('pause', this.handleAudioPause);
      this.audioPlayer.addEventListener('play', this.handleAudioPlay);
      this.audioPlayer.addEventListener('error', this.handleAudioError);
    }
  }

  ngOnDestroy(): void {
    if (!this.audioPlayer) {
      return;
    }
    this.audioPlayer.pause();
    this.audioPlayer.removeEventListener('ended', this.handleAudioEnded);
    this.audioPlayer.removeEventListener('pause', this.handleAudioPause);
    this.audioPlayer.removeEventListener('play', this.handleAudioPlay);
    this.audioPlayer.removeEventListener('error', this.handleAudioError);
  }

  get selectedStory(): StoryItem {
    return this.stories.find((story) => story.id === this.selectedStoryId) ?? this.stories[0];
  }

  selectStory(storyId: string): void {
    this.stopAudio();
    this.selectedStoryId = storyId;
    this.expandedPartIndexes = new Set<number>([0]);
  }

  toggleStoryList(): void {
    this.isStoryListOpen = !this.isStoryListOpen;
  }

  isPartExpanded(index: number): boolean {
    return this.expandedPartIndexes.has(index);
  }

  togglePart(index: number): void {
    if (this.expandedPartIndexes.has(index)) {
      this.expandedPartIndexes.delete(index);
      return;
    }
    this.expandedPartIndexes.add(index);
  }

  getAudioUrlForPart(part: StoryPart): string | null {
    return this.getOrCreatePartAudioMeta(part).audioUrl;
  }

  getGoogleDrivePreviewUrlForPart(part: StoryPart): SafeResourceUrl | null {
    return this.getOrCreatePartAudioMeta(part).previewUrl;
  }

  async toggleAudioForPart(partIndex: number, audioUrl: string): Promise<void> {
    if (!this.audioPlayer) {
      this.audioErrorMessage = 'Trình duyệt hiện tại không hỗ trợ audio player.';
      return;
    }

    this.audioErrorMessage = '';

    if (this.currentAudioPartIndex === partIndex && this.isAudioPlaying) {
      this.audioPlayer.pause();
      return;
    }

    this.currentAudioPartIndex = partIndex;
    this.isAudioLoading = true;

    const candidates = this.getAudioCandidates(audioUrl);
    for (const candidateUrl of candidates) {
      if (this.audioPlayer.src !== candidateUrl) {
        this.audioPlayer.src = candidateUrl;
        this.audioPlayer.load();
      }
      try {
        await this.audioPlayer.play();
        return;
      } catch {
        // Try next candidate URL for Google Drive.
      }
    }

    this.isAudioLoading = false;
    this.isAudioPlaying = false;
    this.audioErrorMessage =
      'Không phát được audio từ Google Drive. Hãy đặt quyền "Anyone with the link", kiểm tra định dạng (mp3/m4a), hoặc thử file nhỏ hơn.';
  }

  stopAudio(): void {
    if (!this.audioPlayer) {
      return;
    }
    this.audioPlayer.pause();
    this.audioPlayer.currentTime = 0;
    this.currentAudioPartIndex = null;
    this.isAudioPlaying = false;
    this.isAudioLoading = false;
  }

  private normalizeAudioSource(source: string): string {
    const trimmed = source.trim();
    if (!trimmed.includes('drive.google.com')) {
      return trimmed;
    }
    const fileId = this.extractGoogleDriveFileId(trimmed);
    if (!fileId) {
      return trimmed;
    }
    return `https://docs.google.com/uc?export=open&id=${fileId}`;
  }

  private getAudioCandidates(source: string): string[] {
    const normalized = this.normalizeAudioSource(source);
    if (!normalized.includes('google.com/uc?')) {
      return [normalized];
    }
    const fileId = this.extractGoogleDriveFileId(source) ?? this.extractGoogleDriveFileId(normalized);
    if (!fileId) {
      return [normalized];
    }
    return [
      `https://docs.google.com/uc?export=open&id=${fileId}`,
      `https://docs.google.com/uc?export=download&id=${fileId}`,
      `https://drive.google.com/uc?export=download&id=${fileId}`
    ];
  }

  private extractGoogleDriveFileId(url: string): string | null {
    const matchByPath = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchByPath?.[1]) {
      return matchByPath[1];
    }

    const matchByQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchByQuery?.[1]) {
      return matchByQuery[1];
    }
    return null;
  }

  private extractGoogleDriveResourceKey(url: string): string | null {
    const match = url.match(/[?&]resourcekey=([^&]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  }

  private buildBackgroundCssUrl(assetPath: string): string {
    if (typeof document === 'undefined') {
      return `url("${assetPath}")`;
    }
    const absoluteUrl = new URL(assetPath, document.baseURI).toString();
    return `url("${absoluteUrl}")`;
  }

  private getOrCreatePartAudioMeta(part: StoryPart): { audioUrl: string | null; previewUrl: SafeResourceUrl | null } {
    const cached = this.partAudioCache.get(part);
    if (cached) {
      return cached;
    }

    const source = part.audioUrl?.trim() ?? null;
    if (!source) {
      const emptyMeta = { audioUrl: null, previewUrl: null };
      this.partAudioCache.set(part, emptyMeta);
      return emptyMeta;
    }

    const audioUrl = this.getAudioCandidates(source)[0] ?? null;
    const fileId = source.includes('drive.google.com') ? this.extractGoogleDriveFileId(source) : null;
    const resourceKey = fileId ? this.extractGoogleDriveResourceKey(source) : null;
    const previewRawUrl = fileId
      ? (resourceKey
        ? `https://drive.google.com/file/d/${fileId}/preview?resourcekey=${resourceKey}`
        : `https://drive.google.com/file/d/${fileId}/preview`)
      : null;

    const meta = {
      audioUrl,
      previewUrl: previewRawUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(previewRawUrl) : null
    };
    this.partAudioCache.set(part, meta);
    return meta;
  }
}
