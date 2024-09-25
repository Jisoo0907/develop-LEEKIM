import { memo, useEffect, useState } from 'react';
import S from './style.module.scss';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { ExhibitionData } from '@/types/ExhibitionData';
import { useIsLogin } from '@/stores/isLogin';
import { A11y, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { SwiperOptions } from 'swiper/types';
import { getImageURL } from '@/utils';

const dbApiUrl = import.meta.env.VITE_DB_API;

function RecentlyViewedExhibition() {
  const [viewedExhibitionData, setViewedExhibitionData] = useState<ExhibitionData[]>([]);
  const [userId, setUserId] = useState<string | null>('');

  const { isLogin } = useIsLogin(({ isLogin }) => ({
    isLogin,
  }));

  useEffect(() => {
    setUserId(sessionStorage.getItem('userId'));

    const getLoginedViewedExhibitionData = async () => {
      const response = await axios.get(`${dbApiUrl}collections/users/records/${userId}`);
      const dataArray = response.data.RecentlyViewed.id;

      if (dataArray.length > 0) {
        const exhibitionDataArray = [];

        for (let id of dataArray) {
          const exhibitionData = await axios.get(`${dbApiUrl}collections/Exhibition/records/${id}`);
          exhibitionDataArray.push(exhibitionData.data);
        }

        setViewedExhibitionData(exhibitionDataArray);
      }
    };

    const getGuestViewedExhibitionData = async () => {
      const exhibitionDataArray = [];
      let sessionDataString = sessionStorage.getItem('recentlyViewed');
      if (sessionDataString === '' || sessionDataString === null) return;

      const sessionDataArray = sessionDataString.split(',');

      for (let id of sessionDataArray) {
        const exhibitionData = await axios.get(`${dbApiUrl}collections/Exhibition/records/${id}`);
        exhibitionDataArray.push(exhibitionData.data);
      }

      setViewedExhibitionData(exhibitionDataArray);
    };

    if (isLogin && userId !== '') {
      getLoginedViewedExhibitionData();
    } else if (!isLogin && userId === '' && sessionStorage.getItem('recentlyViewed') !== '') {
      getGuestViewedExhibitionData();
    }
  }, [userId]);

  const swiperParams: SwiperOptions = {
    modules: [A11y, Keyboard],
    slidesPerView: 'auto',
    spaceBetween: 30,
    keyboard: { enabled: true },
    initialSlide: viewedExhibitionData.length > 3 ? (viewedExhibitionData.length > 4 ? 2 : 1) : 0,
  };

  return (
    <>
      {viewedExhibitionData.length > 0 ? (
        <section className={S.component}>
          <div className={S.titleSection}>
            <h2 className={S.title}>최근 본 전시</h2>
          </div>
          <Swiper {...swiperParams} className={S.swiperWrapper}>
            {viewedExhibitionData.map((item: ExhibitionData, index) =>
              item ? (
                <SwiperSlide key={item.id + index} className={S.slider}>
                  <NavLink to={`/exhibition/detail/${item.id}`} className={S.slider}>
                    <img
                      src={getImageURL(item)}
                      alt={`${item.expand?.School?.Name} ${item.expand?.Major?.Name} 졸업전시 포스터`}
                    />
                  </NavLink>
                </SwiperSlide>
              ) : null
            )}
          </Swiper>
        </section>
      ) : null}
    </>
  );
}

export default memo(RecentlyViewedExhibition);
