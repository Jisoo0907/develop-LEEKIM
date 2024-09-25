import S from './style.module.scss';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import ExhibitionInfo from '@/components/ExhibitionSlider/components/ExhibitionInfo';
import { getImageURL } from '@/utils';
import { ExhibitionData } from '@/types/ExhibitionData';
import { useIsLogin } from '@/stores/isLogin';
import toast, { Toaster } from 'react-hot-toast';
import { UserData } from '@/types/UserData';
import CommonHelmet from '@/components/CommonHelmet';
import { useIsContentPage } from '@/stores/isContentPage';

const dbApiUrl = import.meta.env.VITE_DB_API;

export function Component() {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentlyViewedData, setRecentlyViewedData] = useState<ExhibitionData[] | null>(null);
  const [registerData, setRegisterData] = useState<ExhibitionData[] | null>(null);
  const [bookmarkData, setBookmarkData] = useState<ExhibitionData[] | null>(null);

  const navigate = useNavigate();

  const { enterContentPage } = useIsContentPage(({ enterContentPage }) => ({
    enterContentPage,
  }));

  const { isLogin, logout } = useIsLogin(({ isLogin, logout }) => ({
    isLogin,
    logout,
  }));

  useEffect(() => {
    if (!isLogin) {
      navigate('/', {
        replace: true,
      });
    }

    enterContentPage();

    let localUserData = null;

    const getRelationExhiData = async (RelationIdDataArray, setFunction) => {
      if (!(RelationIdDataArray.length > 0)) return [];

      const dataArray = [];

      for (let id of RelationIdDataArray) {
        const response = await axios.get(`${dbApiUrl}collections/Exhibition/records/${id}?expand=School,Major`);
        dataArray.push(response.data);
      }

      setFunction(dataArray);
    };

    const getRegisterData = async () => {
      const response = await axios.get(
        `${dbApiUrl}collections/Exhibition/records?expand=School,Major&filter=(Author='${userId}')&filter=(IsApprove=true)`
      );
      console.log(response.data.items);
      setRegisterData(response.data.items);
    };

    const getUserData = async () => {
      const response = await axios.get(`${dbApiUrl}collections/users/records/${userId}`);
      localUserData = response.data;
      setUserData(localUserData);

      getRelationExhiData(localUserData.RecentlyViewed.id, setRecentlyViewedData);
      getRegisterData();
      getRelationExhiData(localUserData.Bookmark.id, setBookmarkData);
    };

    try {
      getUserData();
    } catch (err) {
      console.clear();
      window.location.reload();
    }
  }, []);

  const handleLogout = async (e: FormEvent) => {
    e.preventDefault();

    if (confirm('정말 로그아웃 하시겠어요?')) {
      toast.success('로그아웃이 완료되었습니다.\n다음에 또 만나요!');

      await setTimeout(() => {
        sessionStorage.setItem('userId', '');
        logout();
        navigate('/', {
          replace: true,
        });
        toast.remove();
      }, 1500);
    }
  };

  return (
    <main id="page" className={S.component}>
      <CommonHelmet pageTitle="마이페이지" pageDescription="졸전 닷컴 마이페이지" />

      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={10}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },

          // Default options for specific types
          success: {
            duration: 1500,
          },
        }}
      />
      <div className={S.head}>
        <div className={S.headLeft}>
          <p className="sr-only">{userData?.Nickname}님 어서오세요!</p>
          <span className={S.nickName} aria-hidden="true">
            {userData?.Nickname}
          </span>
          <span className={S.welcome} aria-hidden="true">
            님 어서오세요!
          </span>
        </div>
        <div className={S.headRight}>
          <NavLink className={S.headButton} to={`/editProfile/${userId}`}>
            프로필 편집
          </NavLink>
          <NavLink className={S.headButton} to={'/registerExhi'}>
            전시 등록
          </NavLink>
          {userData?.Admin ? (
            <NavLink className={S.headButton} to={'/manageExhibition'}>
              전시 등록 관리
            </NavLink>
          ) : null}
        </div>
      </div>
      <div role="presentation" className={S.contentWrapper}>
        <section className={S.recently}>
          <h2>최근 본 전시</h2>
          <ul>
            {recentlyViewedData?.length > 0 ? (
              recentlyViewedData?.map((item: ExhibitionData) => {
                return (
                  <li key={item.id} className={S.ExhiPoster}>
                    <ExhibitionInfo
                      schoolName={item?.expand?.School?.Name as string}
                      major={item?.expand?.Major?.Name as string}
                      posterUrl={getImageURL(item)}
                      exhiId={item.id}
                    />
                  </li>
                );
              })
            ) : (
              <li className={S.info}>
                <p>최근 본 전시가 존재하지 않습니다.😭</p>
              </li>
            )}
          </ul>
        </section>
        <div role="presentation" className={S.contentBottom}>
          <section className={S.registered}>
            <h2>내가 등록한 전시</h2>
            {registerData?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th scope="col">전시명</th>
                    <th scope="col">학교</th>
                    <th scope="col">학과</th>
                    <th scope="col" style={{ color: 'transparent' }}>
                      바로가기
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registerData?.map((item: ExhibitionData) => {
                    return (
                      <tr key={item.id}>
                        <td>{item.Title}</td>
                        <td>{item?.expand?.School?.Name}</td>
                        <td>{item?.expand?.Major?.Name}</td>
                        <td>
                          <NavLink to={`/exhibition/detail/${item.id}`} className={S.regiLink}>
                            <img src={`/Icon/IconLinkButton.svg`} alt="화살표" />
                          </NavLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>현재 등록된 전시가 없습니다. 전시를 등록해 주세요.😂</p>
            )}
          </section>
          <section className={S.bookmark}>
            <div className={S.bookmarkTitle}>
              <div className={S.bookmarkTitleLeft}>
                <h2>북마크</h2>
                <img src={'/Icon/IconBookmark.svg'} alt="" />
              </div>
              <NavLink to={`/bookmark/${userData?.id}`} className={S.bookmarkLink}>
                전체보기
              </NavLink>
            </div>
            <ul>
              {bookmarkData?.length > 0 ? (
                bookmarkData?.slice(0, 3).map((item: ExhibitionData) => {
                  return (
                    <li key={item.id}>
                      <NavLink to={`/exhibition/detail/${item.id}`}>
                        <img
                          src={getImageURL(item)}
                          alt={`${item?.expand?.School?.Name} ${item?.expand?.Major?.Name} 졸업전시회`}
                        />
                      </NavLink>
                    </li>
                  );
                })
              ) : (
                <li>
                  <p>
                    아직 북마크한 전시가 없어요.
                    <br />
                    마음에 드는 전시를 북마크해 보세요!
                  </p>
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
      <button type="button" onClick={handleLogout}>
        로그아웃
      </button>
    </main>
  );
}
