import { useAuth, useMemberCustomStatus } from '@mezon/core';
import {
	ChannelMembersEntity,
	accountActions,
	authActions,
	clanMembersMetaActions,
	clansActions,
	clearApiCallTracker,
	giveCoffeeActions,
	selectOthersSession,
	selectUserStatus,
	useAppDispatch,
	userClanProfileActions,
	userStatusActions
} from '@mezon/store';
import { createClient as createMezonClient, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { EUserStatus, formatNumber } from '@mezon/utils';
import { Dropdown } from 'flowbite-react';
import isElectron from 'is-electron';
import { Session } from 'mezon-js';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ButtonCopy } from '../../../components';
import HistoryTransaction from '../../HistoryTransaction';
import SettingRightWithdraw from '../../SettingProfile/SettingRightWithdraw';
import ItemProfile from './ItemProfile';
import ItemStatus from './ItemStatus';
import ItemStatusUpdate from './ItemStatusUpdate';
import WalletManagementModal from './WalletManagementModal';

type StatusProfileProps = {
	userById: ChannelMembersEntity | null;
	isDM?: boolean;
	modalRef: React.MutableRefObject<boolean>;
	onClose: () => void;
};
const StatusProfile = ({ userById, isDM, modalRef, onClose }: StatusProfileProps) => {
	const dispatch = useAppDispatch();
	const allAccount = useSelector(selectOthersSession);
	const user = userById?.user;
	const handleCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(true));
	};
	const userCustomStatus = useMemberCustomStatus(user?.id || '', isDM);
	const userStatus = useSelector(selectUserStatus);
	const status = userStatus?.status || 'Online';
	const { userProfile } = useAuth();
	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet || 0;
	}, [userProfile?.wallet]);
	const [isShowModalWithdraw, setIsShowModalWithdraw] = useState<boolean>(false);
	const [isShowModalHistory, setIsShowModalHistory] = useState<boolean>(false);
	const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const handleSendToken = () => {
		dispatch(giveCoffeeActions.setShowModalSendToken(true));
	};

	const handleOpenWithdrawModal = () => {
		setIsShowModalWithdraw(true);
	};
	const handleCloseWithdrawModal = () => {
		setIsShowModalWithdraw(false);
	};
	const handleOpenHistoryModal = () => {
		setIsShowModalHistory(true);
	};
	const handleCloseHistoryModal = () => {
		setIsShowModalHistory(false);
	};

	const handleWalletManagement = () => {
		setShowWalletModal(true);
	};
	const statusIcon = (status: string): ReactNode => {
		switch (status) {
			case EUserStatus.ONLINE:
				return <Icons.OnlineStatus />;
			case EUserStatus.IDLE:
				return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90" />;
			case EUserStatus.DO_NOT_DISTURB:
				return <Icons.MinusCircleIcon />;
			case EUserStatus.INVISIBLE:
				return <Icons.OfflineStatus />;
			default:
				return <Icons.OnlineStatus />;
		}
	};
	const updateUserStatus = (status: string, minutes: number, untilTurnOn: boolean) => {
		dispatch(
			userStatusActions.updateUserStatus({
				status: status,
				minutes: minutes,
				until_turn_on: untilTurnOn
			})
		);
		dispatch(clanMembersMetaActions.updateUserStatus({ userId: userProfile?.user?.id || '', user_status: status }));
		dispatch(accountActions.updateUserStatus(status));
	};

	const { createSocket, connectWithSession } = useMezon();
	const navigate = useNavigate();
	const handleSetAccount = (email: string, password: string) => {
		if (isElectron()) {
			const gw_login = {
				host: process.env.NX_CHAT_APP_API_GW_HOST as string,
				port: process.env.NX_CHAT_APP_API_GW_PORT as string,
				key: process.env.NX_CHAT_APP_API_KEY as string,
				ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
			};
			const clientLogin = createMezonClient(gw_login);

			clientLogin.authenticateEmail(email, password).then((response) => {
				dispatch(authActions.setSession(response));
			});
			navigate('/chat/direct/friend');
			closeModalAddAccount();
			modalRef.current = false;
		}
	};

	const [openModalAddAccount, closeModalAddAccount] = useModal(() => {
		return <AddAccountModal handleSetAccount={handleSetAccount} />;
	});

	const handleSwitchAccount = async () => {
		if (isElectron()) {
			clearApiCallTracker();
			localStorage.removeItem('remember_channel');

			dispatch(clansActions.setCurrentClanId('0'));
			navigate('/chat/direct/friend');
			await createSocket();

			if (allAccount) {
				const { token, refresh_token, created, api_url, is_remember, user_id } = allAccount;

				const session = new Session(token, refresh_token, created, api_url, !!is_remember);

				await connectWithSession({ ...session, is_remember: true });
				if (user_id) dispatch(authActions.switchAccount(user_id));
			}
		}
	};

	const handleOpenSwitchAccount = useCallback(() => {
		if (isElectron()) {
			openModalAddAccount();
			modalRef.current = true;
		}
	}, []);

	return (
		<>
			<div className="max-md:relative">
				<ItemStatus
					children={`Balance: ${formatNumber(Number(tokenInWallet), 'vi-VN', 'VND')}`}
					startIcon={<Icons.Check className="text-theme-primary" />}
					disabled={true}
				/>
				<ItemStatus onClick={handleSendToken} children="Transfer Funds" startIcon={<Icons.SendMoney className="text-theme-primary" />} />
				{/* <ItemStatus
					onClick={handleOpenWithdrawModal}
					children="Withdraw"
					startIcon={<Icons.SendMoney className="transform scale-x-[-1] scale-y-[-1]" />}
				/> */}
				<ItemStatus
					onClick={handleOpenHistoryModal}
					children="History Transaction"
					startIcon={<Icons.History className="text-theme-primary" />}
				/>
				{/* <ItemStatus
					onClick={handleWalletManagement}
					children="Manage Wallet"
					startIcon={
						<span className="w-5 h-5 flex items-center justify-center text-theme-primary">
							{' '}
							<WalletIcon />{' '}
						</span>
					}
				/> */}

				<ItemStatus
					onClick={handleCustomStatus}
					children={`${userCustomStatus ? 'Edit' : 'Set'} Custom Status`}
					startIcon={<Icons.SmilingFace className="text-theme-primary" />}
				/>
				<Dropdown
					trigger="click"
					dismissOnClick={true}
					renderTrigger={() => (
						<div className="capitalize text-theme-primary">
							<ItemStatus children={status} dropdown startIcon={statusIcon(status)} />
						</div>
					)}
					label=""
					placement="right-start"
					className=" bg-theme-contexify text-theme-primary ml-2 py-[6px] px-[8px] w-[200px] max-md:!left-auto max-md:!top-auto max-md:!transform-none max-md:!min-w-full "
				>
					<ItemStatus
						children="Online"
						startIcon={<Icons.OnlineStatus />}
						onClick={() => {
							updateUserStatus('Online', 0, true);
						}}
					/>
					<div className="w-full border-b-theme-primary opacity-70 text-center my-2"></div>
					<ItemStatusUpdate children="Idle" startIcon={<Icons.DarkModeIcon className="text-[#F0B232] -rotate-90" />} dropdown />
					<ItemStatusUpdate children="Do Not Disturb" startIcon={<Icons.MinusCircleIcon />} dropdown />
					<ItemStatusUpdate children="Invisible" startIcon={<Icons.OfflineStatus />} dropdown />
				</Dropdown>
			</div>
			<div className="w-full border-b-theme-primary opacity-70 text-center"></div>
			{isElectron() && (
				<Dropdown
					trigger="click"
					dismissOnClick={true}
					renderTrigger={() => (
						<div>
							<ItemStatus children="Switch Accounts" dropdown startIcon={<Icons.ConvertAccount />} />
						</div>
					)}
					label=""
					placement="right-start"
					className="bg-theme-setting-primary border-none ml-2 py-[6px] px-[8px] w-[100px] max-md:!left-auto max-md:!top-auto max-md:!transform-none max-md:!min-w-full"
				>
					{!allAccount ? (
						<ItemStatus children="Manage Accounts" onClick={handleOpenSwitchAccount} />
					) : (
						<ItemProfile username={allAccount?.username} onClick={handleSwitchAccount} />
					)}
				</Dropdown>
			)}

			<ButtonCopy
				copyText={userProfile?.user?.id || ''}
				title="Copy User ID"
				className=" px-2 py-[6px] text-theme-primary-hover bg-item-theme-hover"
			/>
			{isShowModalWithdraw && <SettingRightWithdraw onClose={handleCloseWithdrawModal} />}
			{isShowModalHistory && <HistoryTransaction onClose={handleCloseHistoryModal} />}

			<WalletManagementModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
		</>
	);
};

const AddAccountModal = ({ handleSetAccount }: { handleSetAccount: (email: string, password: string) => void }) => {
	const inputEmail = useRef<HTMLInputElement>(null);
	const inputPassword = useRef<HTMLInputElement>(null);

	const handleAddAccount = () => {
		handleSetAccount(inputEmail.current?.value || '', inputPassword.current?.value || '');
	};

	return (
		<div
			onClick={(e) => {
				e.stopPropagation();
			}}
			className="w-[100dvw] h-[100dvh] bg-theme-setting-primary z-30 flex items-center justify-center bg-opacity-60 fixed top-0"
		>
			<form className="space-y-2 bg-theme-surface p-12 rounded-lg w-[400px]">
				<label htmlFor="email" className="block text-sm font-medium text-theme-primary">
					Email<span className="text-red-500">*</span>
				</label>
				<div className="space-y-2">
					<input
						ref={inputEmail}
						id="email"
						className="w-full px-3 py-2 rounded-md border-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 bg-input-secondary text-theme-message"
						type="email"
						placeholder="Enter your email"
					/>
				</div>
				<div className="min-h-[20px]"></div>
				<div className="space-y-2">
					<label htmlFor="password" className="block text-sm font-medium text-theme-primary">
						Password<span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<input
							ref={inputPassword}
							id="password"
							type="password"
							className="w-full px-3 py-2 rounded-md pr-10 text-theme-message bg-input-secondary border-theme-primary



						focus:outline-none focus:ring-2 focus:ring-blue-500  "
							autoComplete="off"
							placeholder="Enter your password"
						/>
						<button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-primary">
							<svg
								aria-hidden="true"
								role="img"
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="none"
								viewBox="0 0 24 24"
								className="w-5 h-5"
							>
								<path
									fill="currentColor"
									d="M15.56 11.77c.2-.1.44.02.44.23a4 4 0 1 1-4-4c.21 0 .33.25.23.44a2.5 2.5 0 0 0 3.32 3.32Z"
								></path>
								<path
									fill="currentColor"
									fillRule="evenodd"
									d="M22.89 11.7c.07.2.07.4 0 .6C22.27 13.9 19.1 21 12 21c-7.11 0-10.27-7.11-10.89-8.7a.83.83 0 0 1 0-.6C1.73 10.1 4.9 3 12 3c7.11 0 10.27 7.11 10.89 8.7Zm-4.5-3.62A15.11 15.11 0 0 1 20.85 12c-.38.88-1.18 2.47-2.46 3.92C16.87 17.62 14.8 19 12 19c-2.8 0-4.87-1.38-6.39-3.08A15.11 15.11 0 0 1 3.15 12c.38-.88 1.18-2.47 2.46-3.92C7.13 6.38 9.2 5 12 5c2.8 0 4.87 1.38 6.39 3.08Z"
									clipRule="evenodd"
								></path>
							</svg>
						</button>
					</div>
				</div>
				<div className="min-h-[20px]"></div>
				<button
					type="submit"
					className="w-full px-4 py-2 font-medium focus:outline-none  cursor-pointer  rounded-lg  text-[16px] leading-[24px] btn-primary  whitespace-nowrap
 btn-primary-hover"
					onClick={handleAddAccount}
				>
					Log In
				</button>
			</form>
		</div>
	);
};

export default StatusProfile;
