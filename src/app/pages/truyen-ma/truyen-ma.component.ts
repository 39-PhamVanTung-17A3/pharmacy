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
      subtitle: 'Ngoại truyện về thầy Lương ở làng Thiết Trụ',
      tag: 'Tâm linh - Trinh thám - Nhân văn',
      parts: [
        {
          title: 'Phần 1: Chương 1 - Tiếng ru sau bãi nhãn',
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
          title: 'Phần 2',
          content: ['Nội dung phần 2 đang được cập nhật...']
        },
        {
          title: 'Phần 3',
          content: ['Nội dung phần 3 đang được cập nhật...']
        },
        {
          title: 'Phần 4',
          content: ['Nội dung phần 4 đang được cập nhật...']
        },
        {
          title: 'Phần 5',
          content: ['Nội dung phần 5 đang được cập nhật...']
        },
        {
          title: 'Phần 6',
          content: ['Nội dung phần 6 đang được cập nhật...']
        },
        {
          title: 'Phần 7',
          content: ['Nội dung phần 7 đang được cập nhật...']
        },
        {
          title: 'Phần 8',
          content: ['Nội dung phần 8 đang được cập nhật...']
        },
        {
          title: 'Phần 9',
          content: ['Nội dung phần 9 đang được cập nhật...']
        },
        {
          title: 'Phần 10',
          content: ['Nội dung phần 10 đang được cập nhật...']
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
    if (!part.audioUrl) {
      return null;
    }
    return this.getAudioCandidates(part.audioUrl)[0] ?? null;
  }

  getGoogleDrivePreviewUrlForPart(part: StoryPart): SafeResourceUrl | null {
    const source = part.audioUrl?.trim() ?? null;
    if (!source || !source.includes('drive.google.com')) {
      return null;
    }
    const fileId = this.extractGoogleDriveFileId(source);
    if (!fileId) {
      return null;
    }
    const resourceKey = this.extractGoogleDriveResourceKey(source);
    const previewUrl = resourceKey
      ? `https://drive.google.com/file/d/${fileId}/preview?resourcekey=${resourceKey}`
      : `https://drive.google.com/file/d/${fileId}/preview`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
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
}
