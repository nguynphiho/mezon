import { useColorsRoleById } from '@mezon/core';
import { selectClanMemberMetaUserId, selectMemberClanByUserId2, selectMemberCustomStatusById2, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { UsersClanEntity, createImgproxyUrl } from '@mezon/utils';
import { AvatarImage } from '../../components';
import { useMemberContextMenu } from '../../contexts/MemberContextMenu';
import { UserStatusIconClan } from './MemberProfile';

type BaseMemberProfileProps = {
	id: string;
	creator_id?: string;
};

export const BaseMemberProfile = ({ id, creator_id }: BaseMemberProfileProps) => {
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, id));
	const userMeta = useAppSelector((state) => selectClanMemberMetaUserId(state, id));
	const userCustomStatus = useAppSelector((state) => selectMemberCustomStatusById2(state, user.user?.id || ''));
	const avatar = user.clan_avatar ? user.clan_avatar : (user?.user?.avatar_url ?? '');
	const username = user?.clan_nick || user?.user?.display_name || user?.user?.username || '';
	const isOwnerClan = creator_id === user?.user?.id;

	const { showContextMenu, openProfileItem, setCurrentUser } = useMemberContextMenu();

	const handleClick = (event: React.MouseEvent) => {
		setCurrentUser(user);
		openProfileItem(event, user);
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		const userTemplate: UsersClanEntity = {
			...user,
			id: id,
			prioritizeName: username,
			clan_avatar: avatar,
			user: {
				...user?.user,
				username: user?.user?.username,
				display_name: user?.user?.display_name,
				avatar_url: user?.user?.avatar_url
			}
		};
		showContextMenu(event, userTemplate);
	};

	const isOffline = !userMeta?.online;

	

	return (
		<div className={`relative group w-full ${isOffline ? 'opacity-50' : ''}`}>
			<div onContextMenu={handleContextMenu} onClick={handleClick} className="cursor-pointer flex items-center gap-[9px] relative">
				<div className="relative">
					<AvatarImage
						alt={username}
						username={user?.user?.username ?? username}
						className="min-w-8 min-h-8 max-w-8 max-h-8"
						classNameText="font-semibold"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
					/>
					<div className="rounded-full right-[-4px] absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-theme-primary">
						<UserStatusIconClan status={userMeta?.status} online={userMeta?.online} />
					</div>
				</div>

				<div className="flex flex-col font-medium">
					<ClanUserName userId={user?.id} name={username} isOwnerClan={isOwnerClan} />
					<p className="text-theme-primary w-full text-[12px] line-clamp-1 break-all max-w-[176px] ">{userCustomStatus}</p>
				</div>
			</div>
		</div>
	);
};

export function ClanUserName({ name, userId, isOwnerClan }: { name: string; userId: string; isOwnerClan: boolean }) {
	const userRolesClan = useColorsRoleById(userId || '');

	return (
		<span className="one-line text-start " style={{ color: userRolesClan.highestPermissionRoleColor }}>
			{name}

			{isOwnerClan && (
				<button className="w-[14px] h-[14px] ml-1 pt-[2px]">
					<Icons.OwnerIcon />
				</button>
			)}
		</span>
	);
}
