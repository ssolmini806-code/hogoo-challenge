const KAKAO_APP_KEY = '3e86388cd24e0ec392041b91dd3e238f';
const SHARE_TITLE = '7일 호구 탈출 챌린지 완주! 🎉';
const SHARE_DESCRIPTION = '7일 동안 해냈어. 나처럼 해봐!';

type KakaoSharePayload = {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
};

type KakaoSdk = {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share?: {
    sendDefault: (payload: KakaoSharePayload) => void;
  };
  Link?: {
    sendDefault: (payload: KakaoSharePayload) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

function getCurrentUrl() {
  if (typeof window === 'undefined') return 'https://hogoo-challenge.pages.dev/hogoo-test.html';
  return window.location.href;
}

function getKakao(): KakaoSdk | null {
  if (typeof window === 'undefined' || !window.Kakao) return null;

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_APP_KEY);
  }

  return window.Kakao;
}

export function openSevenDayChallengeShare() {
  if (typeof window === 'undefined') return;

  const shareUrl = getCurrentUrl();
  const payload: KakaoSharePayload = {
    objectType: 'feed',
    content: {
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: '챌린지 보기',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
  };

  const kakao = getKakao();
  const kakaoShare = kakao?.Share ?? kakao?.Link;

  if (kakaoShare?.sendDefault) {
    kakaoShare.sendDefault(payload);
    return;
  }

  if (navigator.share) {
    navigator.share({ title: SHARE_TITLE, text: SHARE_DESCRIPTION, url: shareUrl });
    return;
  }

  window.open(
    `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`,
    'kakao-share',
    'noopener,noreferrer,width=480,height=640',
  );
}
